import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
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

export async function PUT(
  request: Request,
  { params }: { params: { assetType: string; assetnumber: string; id: string } }
) {
  try {
    if (!ASSET_TYPES.has(params.assetType)) {
      return apiJson({ error: 'Invalid asset type' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    if (!ObjectId.isValid(params.id)) {
      return apiJson({ error: 'Invalid id' }, { status: 400 });
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

    const updateDoc: Record<string, unknown> = {
      label,
      fieldType,
      updatedby: session.user.name || session.user.email,
      updatedat: new Date(),
    };

    if (fieldType === 'toggle') {
      updateDoc.valueBool = Boolean(body?.valueBool);
      updateDoc.valueText = null;
      updateDoc.valueNumber = null;
      updateDoc.valueDate = null;
    } else if (fieldType === 'text' || fieldType === 'radio' || fieldType === 'master-select') {
      updateDoc.valueText =
        body?.valueText === null || body?.valueText === undefined ? null : String(body.valueText);
      updateDoc.valueNumber = null;
      updateDoc.valueDate = null;
      updateDoc.valueBool = null;
    } else if (fieldType === 'number') {
      if (body?.valueNumber === null || body?.valueNumber === undefined || body?.valueNumber === '') {
        updateDoc.valueNumber = null;
      } else {
        const n = Number(body.valueNumber);
        if (Number.isNaN(n)) {
          return apiJson({ error: 'Number value must be valid' }, { status: 400 });
        }
        updateDoc.valueNumber = n;
      }
      updateDoc.valueText = null;
      updateDoc.valueDate = null;
      updateDoc.valueBool = null;
    } else {
      if (body?.valueDate === null || body?.valueDate === undefined || body?.valueDate === '') {
        updateDoc.valueDate = null;
      } else {
        const d = new Date(String(body.valueDate));
        if (Number.isNaN(d.getTime())) {
          return apiJson({ error: 'Date value must be valid' }, { status: 400 });
        }
        updateDoc.valueDate = d;
      }
      updateDoc.valueText = null;
      updateDoc.valueNumber = null;
      updateDoc.valueBool = null;
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      {
        _id: new ObjectId(params.id),
        assetType: params.assetType,
        assetnumber: params.assetnumber,
      },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      return apiJson({ error: 'Custom detail not found' }, { status: 404 });
    }

    return apiJson(result);
  } catch (error) {
    console.error('Failed to update custom data:', error);
    return apiJson({ error: 'Failed to update custom data' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { assetType: string; assetnumber: string; id: string } }
) {
  try {
    if (!ASSET_TYPES.has(params.assetType)) {
      return apiJson({ error: 'Invalid asset type' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    if (!ObjectId.isValid(params.id)) {
      return apiJson({ error: 'Invalid id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(params.id),
      assetType: params.assetType,
      assetnumber: params.assetnumber,
    });

    if (result.deletedCount === 0) {
      return apiJson({ error: 'Custom detail not found' }, { status: 404 });
    }

    return apiJson({ success: true });
  } catch (error) {
    console.error('Failed to delete custom data:', error);
    return apiJson({ error: 'Failed to delete custom data' }, { status: 500 });
  }
}
