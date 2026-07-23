import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';

const COLLECTION = 'customdata';
const ASSET_TYPES = new Set(['portable', 'software', 'transport', 'facility', 'mme', 'fixedasset']);
const FIELD_TYPES = new Set(['text', 'number', 'date']);

function isValidAssetType(value: string): boolean {
  return ASSET_TYPES.has(value);
}

export async function GET(
  _request: Request,
  { params }: { params: { assetType: string; assetnumber: string } }
) {
  try {
    if (!isValidAssetType(params.assetType)) {
      return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const docs = await db
      .collection(COLLECTION)
      .find({ assetType: params.assetType, assetnumber: params.assetnumber })
      .sort({ createdat: -1 })
      .toArray();

    return NextResponse.json(docs);
  } catch (error) {
    console.error('Failed to fetch custom data:', error);
    return NextResponse.json({ error: 'Failed to fetch custom data' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { assetType: string; assetnumber: string } }
) {
  try {
    if (!isValidAssetType(params.assetType)) {
      return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const label = String(body?.label ?? '').trim();
    const fieldType = String(body?.fieldType ?? '').trim();

    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }
    if (!FIELD_TYPES.has(fieldType)) {
      return NextResponse.json({ error: 'Invalid field type' }, { status: 400 });
    }

    const doc: Record<string, unknown> = {
      assetType: params.assetType,
      assetnumber: params.assetnumber,
      label,
      fieldType,
      createdby: session.user.name || session.user.email,
      createdat: new Date(),
    };

    if (fieldType === 'text') {
      doc.valueText = body?.valueText === null || body?.valueText === undefined ? null : String(body.valueText);
      doc.valueNumber = null;
      doc.valueDate = null;
    } else if (fieldType === 'number') {
      if (body?.valueNumber === null || body?.valueNumber === undefined || body?.valueNumber === '') {
        doc.valueNumber = null;
      } else {
        const n = Number(body.valueNumber);
        if (Number.isNaN(n)) {
          return NextResponse.json({ error: 'Number value must be valid' }, { status: 400 });
        }
        doc.valueNumber = n;
      }
      doc.valueText = null;
      doc.valueDate = null;
    } else {
      if (body?.valueDate === null || body?.valueDate === undefined || body?.valueDate === '') {
        doc.valueDate = null;
      } else {
        const d = new Date(String(body.valueDate));
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Date value must be valid' }, { status: 400 });
        }
        doc.valueDate = d;
      }
      doc.valueText = null;
      doc.valueNumber = null;
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).insertOne(doc);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create custom data:', error);
    return NextResponse.json({ error: 'Failed to create custom data' }, { status: 500 });
  }
}
