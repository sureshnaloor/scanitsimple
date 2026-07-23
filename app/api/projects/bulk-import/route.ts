import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { ensureLocationCitySeeds } from '@/lib/locationCitySeeds';
import type { Db } from 'mongodb';

type BulkProjectRow = {
  wbs: string;
  projectname: string;
  status: string;
  description: string;
  projectManagerEmpNo: string;
  department: string;
  locationCity: string;
  startDate?: string;
  endDate?: string;
  sourceRow?: number;
};

const ALLOWED_STATUS = new Set(['active', 'inactive', 'completed', 'pending']);

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function parseOptionalDate(value: unknown, rowNo: number, field: string, errors: string[]): Date | null | undefined {
  const text = normalizeText(value);
  if (!text) return undefined;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) {
    errors.push(`Row ${rowNo}: Invalid ${field} "${text}". Use YYYY-MM-DD or a recognized date.`);
    return null;
  }
  return d;
}

async function validateAndNormalizeRows(db: Db, rows: BulkProjectRow[]) {
  const errors: string[] = [];
  const seenWbs = new Set<string>();

  const normalized: BulkProjectRow[] = [];

  for (const row of rows) {
    const rowNo = row.sourceRow ?? 0;
    const wbs = normalizeText(row.wbs);
    const projectname = normalizeText(row.projectname);
    const pm = normalizeText(row.projectManagerEmpNo);
    const department = normalizeText(row.department);
    const locationCity = normalizeText(row.locationCity);

    if (!wbs) {
      errors.push(`Row ${rowNo}: WBS is required.`);
      continue;
    }
    if (!projectname) {
      errors.push(`Row ${rowNo}: Project Name is required.`);
      continue;
    }

    if (seenWbs.has(wbs)) {
      errors.push(`Row ${rowNo}: Duplicate WBS "${wbs}" in uploaded file.`);
      continue;
    }
    seenWbs.add(wbs);

    const statusRaw = normalizeText(row.status);
    if (!statusRaw) {
      errors.push(`Row ${rowNo}: Status is required.`);
      continue;
    }
    const lo = statusRaw.toLowerCase();
    if (!ALLOWED_STATUS.has(lo)) {
      errors.push(
        `Row ${rowNo}: Invalid status "${statusRaw}". Use active, inactive, completed, or pending.`
      );
      continue;
    }
    const status = lo;

    const startDate = parseOptionalDate(row.startDate, rowNo, 'Start Date', errors);
    const endDate = parseOptionalDate(row.endDate, rowNo, 'End Date', errors);
    if (startDate === null || endDate === null) {
      continue;
    }
    if (startDate && endDate && endDate < startDate) {
      errors.push(`Row ${rowNo}: End date cannot be before start date.`);
      continue;
    }

    normalized.push({
      wbs,
      projectname,
      status,
      description: normalizeText(row.description),
      projectManagerEmpNo: pm,
      department,
      locationCity,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
      sourceRow: rowNo,
    });
  }

  if (errors.length > 0) {
    return { errors, normalized: [] as BulkProjectRow[] };
  }

  await ensureLocationCitySeeds(db);
  const collection = db.collection('projects');
  const employeesColl = db.collection('employees');
  const departmentsColl = db.collection('departments');
  const citiesColl = db.collection('locationcities');

  const wbsList = normalized.map((r) => r.wbs);
  const existing = await collection.find({ wbs: { $in: wbsList } }, { projection: { wbs: 1 } }).toArray();
  const existingWbs = new Set(
    existing.map((d) => String((d as unknown as { wbs: string }).wbs).trim())
  );

  const candidates = normalized.filter((r) => !existingWbs.has(r.wbs));
  const skippedExisting = normalized.filter((r) => existingWbs.has(r.wbs));

  if (candidates.length === 0) {
    return {
      errors: [] as string[],
      normalized: [] as BulkProjectRow[],
      skippedExisting,
      insertDocs: [] as Record<string, unknown>[],
    };
  }

  const empNos = Array.from(
    new Set(
      candidates
        .map((c) => normalizeText(c.projectManagerEmpNo))
        .filter((s) => s.length > 0)
    )
  );
  const emps =
    empNos.length > 0
      ? await employeesColl.find({ empno: { $in: empNos }, active: { $ne: 'N' } }).toArray()
      : [];
  const empByNo = new Map(
    emps.map((e) => {
      const doc = e as unknown as { empno: string | number; empname: string };
      return [String(doc.empno), doc] as const;
    })
  );

  const deptNames = Array.from(
    new Set(
      candidates
        .map((c) => normalizeText(c.department))
        .filter((s) => s.length > 0)
    )
  );
  const depts =
    deptNames.length > 0
      ? await departmentsColl.find({ name: { $in: deptNames } }).toArray()
      : [];
  const deptSet = new Set(depts.map((d) => (d as unknown as { name: string }).name));

  const cityKeys = Array.from(
    new Set(
      candidates
        .map((c) => normalizeText(c.locationCity))
        .filter((s) => s.length > 0)
        .map((s) => s.toLowerCase())
    )
  );
  const cityDocs =
    cityKeys.length > 0
      ? await citiesColl
          .find({ kind: 'department', nameKey: { $in: cityKeys } })
          .toArray()
      : [];
  const cityByKey = new Map(
    cityDocs.map((c) => {
      const doc = c as unknown as { nameKey: string; name: string };
      return [doc.nameKey, doc.name] as const;
    })
  );

  const refErrors: string[] = [];
  for (const row of candidates) {
    const rowNo = row.sourceRow ?? 0;
    const pm = normalizeText(row.projectManagerEmpNo);
    if (pm && !empByNo.has(String(pm))) {
      refErrors.push(
        `Row ${rowNo}: Project manager "${pm}" is not an active employee.`
      );
    }
    const dept = normalizeText(row.department);
    if (dept && !deptSet.has(dept)) {
      refErrors.push(`Row ${rowNo}: Department "${dept}" does not exist.`);
    }
    const lc = normalizeText(row.locationCity);
    if (lc && !cityByKey.has(lc.toLowerCase())) {
      refErrors.push(
        `Row ${rowNo}: Location City "${lc}" is not a valid department city (Admin → Locations).`
      );
    }
  }

  if (refErrors.length > 0) {
    return { errors: refErrors, normalized: [] as BulkProjectRow[] };
  }

  const now = new Date();
  const insertDocs = candidates.map((row) => {
    const pm = normalizeText(row.projectManagerEmpNo);
    const manager = pm ? empByNo.get(String(pm)) : undefined;
    const mgr = manager as { empno: string | number; empname: string } | undefined;
    const dept = normalizeText(row.department);
    const lc = normalizeText(row.locationCity);
    const cityName = lc ? cityByKey.get(lc.toLowerCase()) ?? '' : '';
    return {
      wbs: row.wbs,
      projectname: row.projectname,
      status: row.status,
      description: row.description || '',
      projectManagerEmpNo: mgr ? String(mgr.empno) : null,
      projectManagerName: mgr ? mgr.empname : null,
      department: dept,
      locationCity: cityName,
      startDate: row.startDate ? new Date(row.startDate) : null,
      endDate: row.endDate ? new Date(row.endDate) : null,
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    errors: [] as string[],
    normalized: candidates,
    skippedExisting,
    existingWbs,
    insertDocs,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action;
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!['validate', 'insert'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "validate" or "insert".' },
        { status: 400 }
      );
    }

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: 'No rows received for processing.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const result = await validateAndNormalizeRows(db, rows as BulkProjectRow[]);

    if ((result.errors ?? []).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', errors: result.errors },
        { status: 400 }
      );
    }

    const skippedExisting = result.skippedExisting ?? [];
    const insertDocs = result.insertDocs ?? [];
    const candidates = result.normalized;

    if (action === 'validate') {
      return NextResponse.json({
        success: true,
        data: {
          totalUploaded: rows.length,
          validForInsert: insertDocs.length,
          skippedExisting: skippedExisting.map((row) => ({
            wbs: row.wbs,
            sourceRow: row.sourceRow,
          })),
          rowsToInsert: candidates,
        },
        message:
          insertDocs.length > 0
            ? 'Validation successful. New project rows are ready for insertion.'
            : 'Validation successful. No new project rows to insert (all WBS codes already exist).',
      });
    }

    if (!insertDocs.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'No new projects to insert. All uploaded WBS codes already exist.',
          data: {
            skippedExisting: skippedExisting.map((row) => ({
              wbs: row.wbs,
              sourceRow: row.sourceRow,
            })),
          },
        },
        { status: 400 }
      );
    }

    const ins = await db.collection('projects').insertMany(insertDocs);

    return NextResponse.json({
      success: true,
      data: {
        insertedCount: ins.insertedCount,
        skippedExistingCount: skippedExisting.length,
        skippedExisting: skippedExisting.map((row) => ({
          wbs: row.wbs,
          sourceRow: row.sourceRow,
        })),
      },
      message: `Inserted ${ins.insertedCount} project(s) successfully.`,
    });
  } catch (error: unknown) {
    console.error('Error in projects bulk import:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Failed to process projects bulk import.', details: message },
      { status: 500 }
    );
  }
}
