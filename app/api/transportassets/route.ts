import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const COLLECTION = 'transportasset';

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseBody(body: Record<string, unknown>) {
  const assetnumber = normalizeText(body.assetnumber);
  const assetdescription = normalizeText(body.assetdescription);
  const assetcategory = normalizeText(body.assetcategory);
  const assetsubcategory = normalizeText(body.assetsubcategory);
  const assetstatus = normalizeText(body.assetstatus);
  const location = normalizeText(body.location);
  const department = normalizeText(body.department);
  const plateNumber = normalizeText(body.plateNumber);
  const chassisNumber = normalizeText(body.chassisNumber);
  const engineNumber = normalizeText(body.engineNumber);
  const vehicleModel = normalizeText(body.vehicleModel);

  let modelYear: number | null | undefined = undefined;
  if (body.modelYear !== undefined && body.modelYear !== null && body.modelYear !== '') {
    const y = Number(body.modelYear);
    if (Number.isNaN(y)) {
      return { error: 'Model year must be a valid number.' as const };
    }
    modelYear = y;
  }

  let acquiredvalue: number | null | undefined = undefined;
  if (body.acquiredvalue !== undefined && body.acquiredvalue !== null && body.acquiredvalue !== '') {
    const n = Number(body.acquiredvalue);
    if (Number.isNaN(n)) {
      return { error: 'Acquired Value must be a valid number.' as const };
    }
    acquiredvalue = n;
  }

  let acquireddate: Date | null = null;
  const ad = body.acquireddate;
  if (ad !== undefined && ad !== null && ad !== '') {
    const d = new Date(String(ad));
    if (Number.isNaN(d.getTime())) {
      return { error: 'Invalid Acquired Date.' as const };
    }
    acquireddate = d;
  }

  return {
    doc: {
      assetnumber,
      assetdescription,
      assetcategory,
      assetsubcategory,
      assetstatus,
      acquiredvalue: acquiredvalue ?? null,
      acquireddate,
      location,
      department,
      plateNumber,
      chassisNumber,
      engineNumber,
      vehicleModel,
      modelYear: modelYear ?? null
    }
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetNumber = searchParams.get('assetNumber')?.trim() ?? '';
    const assetName = searchParams.get('assetName')?.trim() ?? '';

    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    const hasNum = assetNumber.length >= 2;
    const hasName = assetName.length >= 2;

    if (!hasNum && !hasName) {
      const all = await collection.find({}).sort({ assetnumber: 1 }).toArray();
      return NextResponse.json(all);
    }

    const query: Record<string, unknown> = {};
    if (hasNum) {
      query.assetnumber = { $regex: assetNumber, $options: 'i' };
    }
    if (hasName) {
      query.assetdescription = { $regex: assetName, $options: 'i' };
    }

    const rows = await collection.find(query).sort({ assetnumber: 1 }).toArray();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch transport assets:', error);
    return NextResponse.json({ error: 'Failed to fetch transport assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseBody(body);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { doc } = parsed;
    if (!doc.assetnumber || !doc.assetdescription) {
      return NextResponse.json(
        { error: 'Asset Number and Asset Description are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    const existing = await collection.findOne({ assetnumber: doc.assetnumber });
    if (existing) {
      return NextResponse.json(
        { error: `Transport asset with asset number "${doc.assetnumber}" already exists.` },
        { status: 409 }
      );
    }

    const insertDoc = {
      assetnumber: doc.assetnumber,
      assetdescription: doc.assetdescription,
      assetcategory: doc.assetcategory || '',
      assetsubcategory: doc.assetsubcategory || '',
      assetstatus: doc.assetstatus || '',
      acquiredvalue: doc.acquiredvalue ?? null,
      acquireddate: doc.acquireddate,
      location: doc.location || '',
      department: doc.department || '',
      plateNumber: doc.plateNumber || '',
      chassisNumber: doc.chassisNumber || '',
      engineNumber: doc.engineNumber || '',
      vehicleModel: doc.vehicleModel || '',
      modelYear: doc.modelYear ?? null
    };

    const result = await collection.insertOne(insertDoc);
    const created = await collection.findOne({ _id: result.insertedId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create transport asset:', error);
    return NextResponse.json({ error: 'Failed to create transport asset' }, { status: 500 });
  }
}
