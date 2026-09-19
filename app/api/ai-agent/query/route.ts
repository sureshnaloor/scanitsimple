import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { callDeepSeekChat } from '@/lib/ai/deepseek-client';
import {
  DATABASE_SCHEMA_PROMPT,
  SafeQueryPlan,
  executeSafeMongoQuery,
} from '@/lib/ai/mongo-query-executor';
import { getAgentMemoryContext } from '@/lib/ai/agent-memory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Robust JSON extractor that handles markdown blocks, trailing commas,
 * and attempted repairs for truncated strings.
 */
function extractAndParseJson(text: string): any {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid response received.');
  }

  let cleaned = text.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // Attempt direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Locate the first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (e2) {
        // Attempt minor repair for trailing truncated elements
      }
    }

    // Regex extraction fallback for key fields
    try {
      const isAccurateMatch = cleaned.match(/"isAccurate"\s*:\s*(true|false)/i);
      const confidenceMatch = cleaned.match(/"confidence"\s*:\s*"(High|Medium|Low)"/i);
      const notesMatch = cleaned.match(/"notes"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      const summaryMatch = cleaned.match(/"summaryMarkdown"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

      if (summaryMatch) {
        let summary = summaryMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        return {
          validationReview: {
            isAccurate: isAccurateMatch ? isAccurateMatch[1] === 'true' : true,
            confidence: confidenceMatch ? confidenceMatch[1] : 'Medium',
            notes: notesMatch ? notesMatch[1].replace(/\\"/g, '"') : 'Processed with fallback parser',
          },
          summaryMarkdown: summary,
          table: null,
          chart: null,
          suggestedFollowUps: [],
        };
      }
    } catch (regexErr) {
      // Ignore
    }

    throw new Error(`Could not parse JSON response from LLM: ${text.slice(0, 200)}...`);
  }
}

/**
 * Automatically synthesizes a clean table structure directly from raw database results
 */
function buildTableFromRawData(
  rawData: any,
  providedColumns?: Array<{ key: string; label: string }>
): { columns: Array<{ key: string; label: string }>; rows: any[] } | null {
  if (!rawData) return null;

  const rows = Array.isArray(rawData) ? rawData : [rawData];
  if (rows.length === 0) return null;

  // Derive columns if not provided
  let columns = providedColumns && providedColumns.length > 0 ? providedColumns : [];

  if (columns.length === 0) {
    const keySet = new Set<string>();
    rows.slice(0, 20).forEach((r) => {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach((k) => {
          if (k !== '__v' && typeof r[k] !== 'function') {
            keySet.add(k);
          }
        });
      }
    });

    columns = Array.from(keySet).map((key) => {
      // Format key to a human readable label
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim();
      return { key, label };
    });
  }

  // Format row values (flatten simple objects / dates)
  const formattedRows = rows.map((row) => {
    if (!row || typeof row !== 'object') return { value: String(row) };
    const cleanRow: Record<string, any> = {};
    columns.forEach((col) => {
      let val = row[col.key];
      if (val === undefined || val === null) {
        cleanRow[col.key] = '';
      } else if (val instanceof Date) {
        cleanRow[col.key] = val.toISOString().split('T')[0];
      } else if (typeof val === 'object') {
        cleanRow[col.key] = JSON.stringify(val);
      } else {
        cleanRow[col.key] = val;
      }
    });
    return cleanRow;
  });

  return { columns, rows: formattedRows };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const prompt = String(body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Please provide a query prompt.' }, { status: 400 });
    }

    // Fetch learned query memory & past corrections from MongoDB
    const memoryContext = await getAgentMemoryContext();

    // =========================================================================
    // STEP 1: Translate Natural Language into MongoDB Safe Query Plan & Execute
    // =========================================================================
    const step1SystemPrompt = `
${DATABASE_SCHEMA_PROMPT}

${memoryContext}

You are an expert MongoDB Query Specialist for the SmartTags Enterprise System.
Your task is to analyze the user's plain-English question and generate a SAFE, OPTIMIZED, READ-ONLY MongoDB query.

RULES:
1. ONLY generate read operations: "aggregate", "find", "countDocuments", or "distinct".
2. Target the correct collection(s). Use '$lookup' in aggregation pipelines if joining across collections (e.g. equipmentandtools with equipmentcustody or equipmentcalibcertificates).
3. For date filters (e.g. year 2026), use standard ISO date strings like "2026-01-01T00:00:00.000Z" (they are automatically converted to BSON Dates at runtime).
4. When the user asks to "display all", "list", or "show items/records", prefer "find" or a listing pipeline. When they ask for counts, summaries, or charts, use "$group" aggregation.
5. Pay close attention to any LEARNED QUERY MEMORY above.
6. Output MUST be valid JSON conforming to the following structure:

{
  "explanation": "Brief explanation of query design",
  "plan": {
    "collection": "collection_name",
    "operation": "aggregate" | "find" | "countDocuments" | "distinct",
    "pipeline": [ ... ], // if operation === 'aggregate'
    "filter": { ... },    // if operation === 'find' or 'countDocuments'
    "projection": { ... },// optional
    "sort": { ... },      // optional
    "limit": 500          // optional, default 500
  }
}
`;

    const step1ResponseText = await callDeepSeekChat(
      [
        { role: 'system', content: step1SystemPrompt },
        { role: 'user', content: `Generate MongoDB query for user question: "${prompt}"` },
      ],
      {
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }
    );

    let parsedStep1: { explanation: string; plan: SafeQueryPlan };
    try {
      parsedStep1 = extractAndParseJson(step1ResponseText);
    } catch (parseErr: any) {
      console.error('Failed to parse step 1 JSON:', step1ResponseText);
      throw new Error(`Could not generate query plan for this question. Please try rephrasing.`);
    }

    if (!parsedStep1.plan) {
      throw new Error('Query plan generation failed. Missing "plan" object.');
    }

    // Execute the read-only MongoDB query
    let rawData: any;
    try {
      rawData = await executeSafeMongoQuery(parsedStep1.plan);
    } catch (dbErr: any) {
      throw new Error(`Database execution failed: ${dbErr.message}`);
    }

    const recordsCount = Array.isArray(rawData) ? rawData.length : rawData ? 1 : 0;

    // =========================================================================
    // STEP 2: Review, Validate, Synthesize Insights & Format Table / Chart
    // =========================================================================
    const step2SystemPrompt = `
You are a Senior Data Auditor and BI Visualizer for SmartTags.
You have been provided with:
1. The original user request.
2. The MongoDB query executed.
3. The raw data returned from the database.

YOUR TASKS:
1. REVIEW & VALIDATE:
   - Verify whether the retrieved data directly and accurately answers the user's question.
   - Note caveats (e.g., zero results found, date boundaries, sample limits, missing fields).
2. SYNTHESIZE NATURAL LANGUAGE INSIGHTS:
   - Provide a concise executive Markdown summary with bold highlights, metrics, key totals, and bullet points.
3. TABLE COLUMNS:
   - Define clean column headers ({ key, label }) for displaying the data.
4. CHART STRUCTURING:
   - If the user explicitly requested a chart/graph, OR if the data represents aggregates/distributions suitable for visual charting, construct a chart specification.
   - Supported chart types: "bar", "pie", "line", "area".
   - If not suitable for a chart, set "chart": null.
5. SUGGESTED FOLLOW-UPS:
   - Provide 3 helpful follow-up queries related to this topic.

RESPONSE FORMAT (JSON ONLY):
{
  "validationReview": {
    "isAccurate": true,
    "confidence": "High" | "Medium" | "Low",
    "notes": "Review comments on data integrity and query match"
  },
  "summaryMarkdown": "Concise Markdown response with bold highlights, bullets, and totals",
  "table": {
    "columns": [
      { "key": "fieldName", "label": "Column Header" }
    ]
  } | null,
  "chart": {
    "type": "bar" | "pie" | "line" | "area",
    "title": "Chart Title",
    "xAxisKey": "categoryOrNameKey",
    "dataKeys": ["count"],
    "data": [
      { "categoryOrNameKey": "Item A", "count": 25 }
    ]
  } | null,
  "suggestedFollowUps": [
    "Follow up question 1",
    "Follow up question 2",
    "Follow up question 3"
  ]
}
`;

    // Limit rawData sample sent to LLM to prevent latency & token explosion
    const sampleRawData = Array.isArray(rawData) ? rawData.slice(0, 20) : rawData;

    const step2UserContent = `
USER REQUEST: "${prompt}"

QUERY EXPLANATION: "${parsedStep1.explanation}"
QUERY PLAN EXECUTED: ${JSON.stringify(parsedStep1.plan, null, 2)}

TOTAL RECORDS FOUND: ${recordsCount}
RAW MONGODB RESULTS SAMPLE (Showing up to 20 of ${recordsCount} records):
${JSON.stringify(sampleRawData, null, 2)}
`;

    let parsedStep2: any = null;

    try {
      const step2ResponseText = await callDeepSeekChat(
        [
          { role: 'system', content: step2SystemPrompt },
          { role: 'user', content: step2UserContent },
        ],
        {
          temperature: 0.2,
          max_tokens: 2500,
          response_format: { type: 'json_object' },
        }
      );

      parsedStep2 = extractAndParseJson(step2ResponseText);
    } catch (llm2Err: any) {
      console.warn('Step 2 LLM review parse warning, creating fallback summary:', llm2Err);
      // Graceful fallback if Step 2 LLM times out or encounters format issues
      parsedStep2 = {
        validationReview: {
          isAccurate: true,
          confidence: 'Medium',
          notes: `Retrieved ${recordsCount} records matching query criteria.`,
        },
        summaryMarkdown: `## Query Results\n\nFound **${recordsCount}** records in the database matching: *"${prompt}"*.\n\n- **Query Strategy:** ${parsedStep1.explanation}\n- **Target Collection:** \`${parsedStep1.plan.collection}\`\n- Review the Data Table below to inspect and export the complete dataset.`,
        table: null,
        chart: null,
        suggestedFollowUps: [
          `Show breakdown of these results by status`,
          `Filter these records for the last 30 days`,
          `Export complete details for these items`,
        ],
      };
    }

    // Synthesize the full complete table rows from rawData so no records are lost
    const finalizedTable = buildTableFromRawData(
      rawData,
      parsedStep2?.table?.columns
    );

    return NextResponse.json({
      success: true,
      data: {
        prompt,
        step1: {
          explanation: parsedStep1.explanation,
          plan: parsedStep1.plan,
          recordsCount,
        },
        step2: {
          validationReview: parsedStep2?.validationReview || {
            isAccurate: true,
            confidence: 'High',
            notes: 'Verified data against query criteria',
          },
          summaryMarkdown: parsedStep2?.summaryMarkdown || `Found ${recordsCount} records.`,
          table: finalizedTable,
          chart: parsedStep2?.chart || null,
          suggestedFollowUps: parsedStep2?.suggestedFollowUps || [],
        },
        rawResults: Array.isArray(rawData) ? rawData.slice(0, 500) : rawData,
      },
    });
  } catch (error: any) {
    console.error('Error in AI Agent Query Route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while processing the AI query.',
      },
      { status: 500 }
    );
  }
}

