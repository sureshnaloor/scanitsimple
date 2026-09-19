import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { callDeepSeekChat } from '@/lib/ai/deepseek-client';

export interface MemoryRule {
  _id?: string;
  topic: string;
  rule: string;
  promptContext?: string;
  createdAt: Date;
  createdBy?: string;
}

/**
 * Checks if a given email is registered in AIADMIN_USERS environment variable.
 * Supports JSON array format (e.g. '["admin@test.com", "user@test.com"]') and comma/space separated strings.
 */
export function isAiAdminUser(email?: string | null): boolean {
  if (!email) return false;

  const envRaw = (
    process.env.AIADMIN_USERS ||
    process.env.AI_ADMIN_USERS ||
    process.env.NEXT_PUBLIC_AIADMIN_USERS ||
    ''
  ).trim();

  if (!envRaw) return false;

  let adminEmails: string[] = [];

  if (envRaw.startsWith('[') && envRaw.endsWith(']')) {
    try {
      adminEmails = JSON.parse(envRaw);
    } catch {
      adminEmails = envRaw.replace(/[\[\]"]/g, '').split(/[\s,]+/);
    }
  } else {
    adminEmails = envRaw.replace(/[\[\]"]/g, '').split(/[\s,]+/);
  }

  const userEmail = email.trim().toLowerCase();
  return adminEmails
    .map((e) => String(e).trim().toLowerCase())
    .filter(Boolean)
    .includes(userEmail);
}

const COLLECTION_NAME = 'ai-agent-knowledge';

const BASELINE_RULES: Omit<MemoryRule, '_id'>[] = [
  {
    topic: 'MME vs Fixed Assets Identification',
    rule: "MME equipment assets are in collection 'equipmentandtools' with asset numbers starting with '5' or '9'. Fixed assets are in 'fixedassets' with asset numbers not starting with 5 or 9.",
    createdAt: new Date('2026-01-01'),
    createdBy: 'system',
  },
  {
    topic: 'Active Custody Lookups',
    rule: "In 'equipmentcustody', the CURRENT active custodian record has 'custodyto' equal to null or missing (unset). Past handover records have a non-null 'custodyto' date.",
    createdAt: new Date('2026-01-01'),
    createdBy: 'system',
  },
  {
    topic: 'PPE Issue Date Filters',
    rule: "In 'ppe-records', 'dateOfIssue' is a BSON Date. When querying by year, quarter, or date range, use standard ISO date comparisons (e.g. $gte: '2026-01-01T00:00:00.000Z').",
    createdAt: new Date('2026-01-01'),
    createdBy: 'system',
  },
  {
    topic: 'Calibration Validity Status',
    rule: "In 'equipmentcalibcertificates', 'calibrationtodate' represents certificate expiry. Valid active certificates have 'calibrationtodate' >= current date.",
    createdAt: new Date('2026-01-01'),
    createdBy: 'system',
  },
];

/**
 * Ensures baseline memory rules exist in MongoDB
 */
async function ensureBaselineSeeded() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany(BASELINE_RULES.map((r) => ({ ...r, createdAt: new Date() })));
    }
  } catch (err) {
    console.warn('Failed to seed baseline memory rules:', err);
  }
}

/**
 * Returns formatted Markdown context containing all active memory rules to inject into LLM prompts.
 */
export async function getAgentMemoryContext(): Promise<string> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    await ensureBaselineSeeded();

    const rules = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    if (!rules || rules.length === 0) {
      return '';
    }

    const ruleLines = rules.map((r: any) => `- [${r.topic}]: ${r.rule}`).join('\n');

    return `
### LEARNED QUERY MEMORY & PAST CORRECTIONS (Strictly follow these learned rules):
${ruleLines}
`;
  } catch (err) {
    console.warn('Error reading agent memory context:', err);
    return '';
  }
}

/**
 * Fetches all memory rules for user inspection
 */
export async function getAllMemoryRules(): Promise<MemoryRule[]> {
  const { db } = await connectToDatabase();
  const collection = db.collection(COLLECTION_NAME);

  await ensureBaselineSeeded();

  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();

  return docs.map((doc: any) => ({
    _id: doc._id.toString(),
    topic: doc.topic,
    rule: doc.rule,
    promptContext: doc.promptContext,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy || 'system',
  }));
}

/**
 * Adds a manual memory rule
 */
export async function addMemoryRule(data: {
  topic: string;
  rule: string;
  promptContext?: string;
  createdBy?: string;
}): Promise<string> {
  const { db } = await connectToDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const newDoc = {
    topic: data.topic.trim(),
    rule: data.rule.trim(),
    promptContext: data.promptContext?.trim() || '',
    createdAt: new Date(),
    createdBy: data.createdBy || 'user',
  };

  const result = await collection.insertOne(newDoc);
  return result.insertedId.toString();
}

/**
 * Deletes a memory rule by ID
 */
export async function deleteMemoryRule(id: string): Promise<boolean> {
  const { db } = await connectToDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/**
 * Automatically summarizes user feedback & correction on a query into a concise 1-sentence memory rule.
 */
export async function summarizeAndLearnCorrection(params: {
  userPrompt: string;
  userCorrection: string;
  queryPlan?: any;
  userEmail?: string;
}): Promise<{ topic: string; rule: string; id: string }> {
  const systemPrompt = `
You are an AI Knowledge Distiller for the SmartTags Asset & PPE Management System.
The user asked a question, the AI produced a query/answer, and the user provided a CORRECTION or FEEDBACK explaining what was wrong or how the query should behave.

Your task is to synthesize this correction into:
1. "topic": A concise 2-4 word subject (e.g. "PPE Size Field", "Asset Valuation Sorting", "Calibration Expiry Filter").
2. "rule": A single, crystal-clear, actionable sentence explaining the exact rule/pattern to follow in MongoDB queries.

Output MUST be JSON:
{
  "topic": "Topic Name",
  "rule": "Exact concise rule instruction"
}
`;

  const userContent = `
ORIGINAL USER QUESTION: "${params.userPrompt}"
EXECUTED QUERY PLAN: ${JSON.stringify(params.queryPlan || {}, null, 2)}
USER CORRECTION / FEEDBACK: "${params.userCorrection}"
`;

  let parsed: { topic: string; rule: string };
  try {
    const responseText = await callDeepSeekChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      {
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }
    );

    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }
    parsed = JSON.parse(cleaned);
  } catch (err) {
    parsed = {
      topic: 'Query Correction',
      rule: params.userCorrection.trim(),
    };
  }

  const topic = parsed.topic || 'Query Rule';
  const rule = parsed.rule || params.userCorrection.trim();

  const id = await addMemoryRule({
    topic,
    rule,
    promptContext: params.userPrompt,
    createdBy: params.userEmail || 'user',
  });

  return { topic, rule, id };
}
