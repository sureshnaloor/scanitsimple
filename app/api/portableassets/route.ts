import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PORTABLE_TYPES } from '@/lib/portableAssetTypes';

const COLLECTION = 'portableasset';

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parsePortableType(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const s = normalizeText(raw);
  if (!s) return { ok: true, value: '' };
  const lower = s.toLowerCase().replace(/\s+/g, '_').replace(/'/g, '');
  const aliases: Record<string, string> = {
    pre_engineered: 'pre_engineered',
    preengineered: 'pre_engineered',
    container_20: 'container_20',
    container20: 'container_20',
    container_40: 'container_40',
    container40: 'container_40',
    prefabricated_sheet: 'prefabricated_sheet',
    prefabricatedsheet: 'prefabricated_sheet',
    sheet: 'prefabricated_sheet'
  };
  const mapped = aliases[lower] ?? lower;
  if (!PORTABLE_TYPES.has(mapped)) {
    return {
      ok: false,
      error:
        'Invalid portable type. Use: pre_engineered, container_20, container_40, prefabricated_sheet, or leave empty.'
    };
  }
  return { ok: true, value: mapped };
}

function parseBody(body: Record<string, unknown>) {
  const assetnumber = normalizeText(body.assetnumber);
  const assetdescription = normalizeText(body.assetdescription);
  const assetcategory = normalizeText(body.assetcategory);
  const assetsubcategory = normalizeText(body.assetsubcategory);
  const assetstatus = normalizeText(body.assetstatus);
  const location = normalizeText(body.location);
  const department = normalizeText(body.department);
  const installationLocation = normalizeText(body.installationLocation);

  const pt = parsePortableType(body.portableType);
  if (!pt.ok) return { error: pt.error };

  let acquiredvalue: number | null | undefined = undefined;
  if (body.acquiredvalue !== undefined && body.acquiredvalue !== null && body.acquiredvalue !== '') {
    const n = Number(body.acquiredvalue);
    if (Number.isNaN(n)) {
      return { error: 'Acquired Value must be a valid number.' };
    }
    acquiredvalue = n;
  }

  let acquireddate: Date | null = null;
  const ad = body.acquireddate;
  if (ad !== undefined && ad !== null && ad !== '') {
    const d = new Date(String(ad));
    if (Number.isNaN(d.getTime())) {
      return { error: 'Invalid Acquired Date.' };
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
      portableType: pt.value,
      installationLocation
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
    console.error('Failed to fetch portable assets:', error);
    return NextResponse.json({ error: 'Failed to fetch portable assets' }, { status: 500 });
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
        { error: `Portable asset with asset number "${doc.assetnumber}" already exists.` },
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
      portableType: doc.portableType || '',
      installationLocation: doc.installationLocation || ''
    };

    const result = await collection.insertOne(insertDoc);
    const created = await collection.findOne({ _id: result.insertedId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create portable asset:', error);
    return NextResponse.json({ error: 'Failed to create portable asset' }, { status: 500 });
  }
}
