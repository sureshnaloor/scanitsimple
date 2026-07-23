import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const COLLECTION = 'transportasset';

type BulkRow = {
  assetnumber: string;
  assetdescription: string;
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
  acquiredvalue?: number;
  acquireddate?: string;
  location?: string;
  department?: string;
  plateNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  vehicleModel?: string;
  modelYear?: number | null;
  sourceRow?: number;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function normalizeDate(value: unknown, rowNo: number, errors: string[]) {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    errors.push(`Row ${rowNo}: Invalid Acquired Date "${text}". Use YYYY-MM-DD format.`);
    return undefined;
  }
  return date;
}

function validateRows(rows: BulkRow[]) {
  const errors: string[] = [];
  const normalizedRows: BulkRow[] = [];
  const seenAssetNumbers = new Set<string>();

  rows.forEach((row, index) => {
    const rowNo = row.sourceRow ?? index + 2;
    const assetnumber = normalizeText(row.assetnumber);
    const assetdescription = normalizeText(row.assetdescription);

    if (!assetnumber) {
      errors.push(`Row ${rowNo}: Asset Number is required.`);
      return;
    }
    if (!assetdescription) {
      errors.push(`Row ${rowNo}: Asset Description is required.`);
      return;
    }
    if (seenAssetNumbers.has(assetnumber)) {
      errors.push(`Row ${rowNo}: Duplicate Asset Number "${assetnumber}" found in uploaded file.`);
      return;
    }

    const acquiredValueText = normalizeText(row.acquiredvalue);
    let acquiredvalue: number | undefined = undefined;
    if (acquiredValueText) {
      const parsed = Number(acquiredValueText);
      if (Number.isNaN(parsed)) {
        errors.push(`Row ${rowNo}: Acquired Value must be a valid number.`);
        return;
      }
      acquiredvalue = parsed;
    }

    const acquireddate = normalizeDate(row.acquireddate, rowNo, errors);
    if (errors.length > 0 && errors[errors.length - 1].startsWith(`Row ${rowNo}: Invalid Acquired Date`)) {
      return;
    }

    const yearRaw =
      row.modelYear !== undefined && row.modelYear !== null ? String(row.modelYear).trim() : '';
    let modelYear: number | null | undefined = undefined;
    if (yearRaw) {
      const y = Number(yearRaw);
      if (Number.isNaN(y)) {
        errors.push(`Row ${rowNo}: Year must be a valid number.`);
        return;
      }
      modelYear = y;
    }

    seenAssetNumbers.add(assetnumber);
    normalizedRows.push({
      assetnumber,
      assetdescription,
      assetcategory: normalizeText(row.assetcategory),
      assetsubcategory: normalizeText(row.assetsubcategory),
      assetstatus: normalizeText(row.assetstatus),
      acquiredvalue,
      acquireddate: acquireddate ? acquireddate.toISOString() : undefined,
      location: normalizeText(row.location),
      department: normalizeText(row.department),
      plateNumber: normalizeText(row.plateNumber),
      chassisNumber: normalizeText(row.chassisNumber),
      engineNumber: normalizeText(row.engineNumber),
      vehicleModel: normalizeText(row.vehicleModel),
      modelYear: modelYear ?? null,
      sourceRow: rowNo
    });
  });

  return { errors, normalizedRows };
}

export async function POST(request: Request) {
  try {
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

    const { errors, normalizedRows } = validateRows(rows);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', errors },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    const assetNumbers = normalizedRows.map((row) => row.assetnumber);
    const existingAssets = await collection
      .find({ assetnumber: { $in: assetNumbers } }, { projection: { assetnumber: 1 } })
      .toArray();

    const existingAssetSet = new Set(
      existingAssets.map((asset) => String((asset as { assetnumber?: string }).assetnumber))
    );
    const rowsToInsert = normalizedRows.filter((row) => !existingAssetSet.has(row.assetnumber));
    const skippedExisting = normalizedRows.filter((row) => existingAssetSet.has(row.assetnumber));

    if (action === 'validate') {
      return NextResponse.json({
        success: true,
        data: {
          totalUploaded: normalizedRows.length,
          validForInsert: rowsToInsert.length,
          skippedExisting: skippedExisting.map((row) => ({
            assetnumber: row.assetnumber,
            sourceRow: row.sourceRow
          })),
          rowsToInsert
        },
        message:
          rowsToInsert.length > 0
            ? 'Validation successful. New transport asset rows are ready for insertion.'
            : 'Validation successful. No new transport asset rows to insert.'
      });
    }

    if (rowsToInsert.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No new transport assets to insert. All uploaded asset numbers already exist.',
          data: {
            skippedExisting: skippedExisting.map((row) => ({
              assetnumber: row.assetnumber,
              sourceRow: row.sourceRow
            }))
          }
        },
        { status: 400 }
      );
    }

    const insertDocs = rowsToInsert.map((row) => ({
      assetnumber: row.assetnumber,
      assetdescription: row.assetdescription,
      assetcategory: row.assetcategory || '',
      assetsubcategory: row.assetsubcategory || '',
      assetstatus: row.assetstatus || '',
      acquiredvalue: row.acquiredvalue ?? null,
      acquireddate: row.acquireddate ? new Date(row.acquireddate) : null,
      location: row.location || '',
      department: row.department || '',
      plateNumber: row.plateNumber || '',
      chassisNumber: row.chassisNumber || '',
      engineNumber: row.engineNumber || '',
      vehicleModel: row.vehicleModel || '',
      modelYear: row.modelYear ?? null
    }));

    const result = await collection.insertMany(insertDocs);

    return NextResponse.json({
      success: true,
      data: {
        insertedCount: result.insertedCount,
        skippedExistingCount: skippedExisting.length,
        skippedExisting: skippedExisting.map((row) => ({
          assetnumber: row.assetnumber,
          sourceRow: row.sourceRow
        }))
      },
      message: `Inserted ${result.insertedCount} transport asset(s) successfully.`
    });
  } catch (error: unknown) {
    console.error('Error in transport assets bulk import:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process transport assets bulk import.',
        details: message
      },
      { status: 500 }
    );
  }
}
