import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'customdata';
const ASSET_TYPES = new Set([
  'portable',
  'software',
  'transport',
  'facility',
  'mme',
  'fixedasset',
  'tool',
  'custody',
  'calibration',
]);
const FIELD_TYPES = new Set(['text', 'number', 'date', 'toggle', 'radio', 'master-select']);

function isValidAssetType(value: string): boolean {
  return ASSET_TYPES.has(value);
}

export async function GET(
  _request: Request,
  { params }: { params: { assetType: string; assetnumber: string } }
) {
  try {
    if (!isValidAssetType(params.assetType)) {
      return apiJson({ error: 'Invalid asset type' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const docs = await db
      .collection(COLLECTION)
      .find({ assetType: params.assetType, assetnumber: params.assetnumber })
      .sort({ createdat: -1 })
      .toArray();

    return apiJson(docs);
  } catch (error) {
    console.error('Failed to fetch custom data:', error);
    return apiJson({ error: 'Failed to fetch custom data' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { assetType: string; assetnumber: string } }
) {
  try {
    if (!isValidAssetType(params.assetType)) {
      return apiJson({ error: 'Invalid asset type' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    const body = await request.json();
    const label = String(body?.label ?? '').trim();
    const fieldType = String(body?.fieldType ?? '').trim();

    if (!label) {
      return apiJson({ error: 'Label is required' }, { status: 400 });
    }
    if (!FIELD_TYPES.has(fieldType)) {
      return apiJson({ error: 'Invalid field type' }, { status: 400 });
    }

    const doc: Record<string, unknown> = {
      assetType: params.assetType,
      assetnumber: params.assetnumber,
      label,
      fieldType,
      createdby: session.user.name || session.user.email,
      createdat: new Date(),
    };

    // Optional link to an admin-defined custom field definition
    if (body?.defId) doc.defId = String(body.defId);
    if (body?.fieldKey) doc.fieldKey = String(body.fieldKey);

    if (fieldType === 'toggle') {
      doc.valueBool = Boolean(body?.valueBool);
      doc.valueText = null;
      doc.valueNumber = null;
      doc.valueDate = null;
    } else if (fieldType === 'radio' || fieldType === 'master-select' || fieldType === 'text') {
      doc.valueText = body?.valueText === null || body?.valueText === undefined ? null : String(body.valueText);
      doc.valueNumber = null;
      doc.valueDate = null;
      doc.valueBool = null;
    } else if (fieldType === 'number') {
      if (body?.valueNumber === null || body?.valueNumber === undefined || body?.valueNumber === '') {
        doc.valueNumber = null;
      } else {
        const n = Number(body.valueNumber);
        if (Number.isNaN(n)) {
          return apiJson({ error: 'Number value must be valid' }, { status: 400 });
        }
        doc.valueNumber = n;
      }
      doc.valueText = null;
      doc.valueDate = null;
      doc.valueBool = null;
    } else {
      if (body?.valueDate === null || body?.valueDate === undefined || body?.valueDate === '') {
        doc.valueDate = null;
      } else {
        const d = new Date(String(body.valueDate));
        if (Number.isNaN(d.getTime())) {
          return apiJson({ error: 'Date value must be valid' }, { status: 400 });
        }
        doc.valueDate = d;
      }
      doc.valueText = null;
      doc.valueNumber = null;
      doc.valueBool = null;
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).insertOne(doc);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    return apiJson(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create custom data:', error);
    return apiJson({ error: 'Failed to create custom data' }, { status: 500 });
  }
}
