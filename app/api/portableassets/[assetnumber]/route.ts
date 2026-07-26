import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PORTABLE_TYPES } from '@/lib/portableAssetTypes';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'portableasset';
const MOD = 'portable_modification';

export async function GET(
  _request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const asset = await db.collection(COLLECTION).findOne({ assetnumber: params.assetnumber });

    if (!asset) {
      return apiJson({ error: 'Portable asset not found' }, { status: 404 });
    }

    return apiJson(asset);
  } catch (error) {
    console.error('Failed to fetch portable asset:', error);
    return apiJson({ error: 'Failed to fetch portable asset' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const updateData = await request.json();

    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    const existing = await collection.findOne({ assetnumber });
    if (!existing) {
      return apiJson({ error: `Portable asset ${assetnumber} not found` }, { status: 404 });
    }

    const { _id, assetnumber: _skip, ...rest } = updateData;

    const allowed = [
      'assetdescription',
      'assetcategory',
      'assetsubcategory',
      'assetstatus',
      'acquiredvalue',
      'acquireddate',
      'location',
      'department',
      'portableType',
      'installationLocation'
    ] as const;

    const $set: Record<string, unknown> = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(rest, key)) {
        const v = rest[key];
        if (key === 'acquiredvalue') {
          if (v === null || v === undefined || v === '') {
            $set[key] = null;
          } else {
            const n = Number(v);
            if (Number.isNaN(n)) {
              return apiJson({ error: 'Acquired Value must be a valid number.' }, { status: 400 });
            }
            $set[key] = n;
          }
        } else if (key === 'acquireddate') {
          if (v === null || v === undefined || v === '') {
            $set[key] = null;
          } else {
            const d = new Date(String(v));
            if (Number.isNaN(d.getTime())) {
              return apiJson({ error: 'Invalid Acquired Date.' }, { status: 400 });
            }
            $set[key] = d;
          }
        } else if (key === 'portableType') {
          const s = v === null || v === undefined ? '' : String(v).trim();
          if (!PORTABLE_TYPES.has(s)) {
            return apiJson(
              {
                error:
                  'Invalid portable type. Use pre_engineered, container_20, container_40, prefabricated_sheet, or empty.'
              },
              { status: 400 }
            );
          }
          $set[key] = s;
        } else {
          $set[key] = v === null || v === undefined ? '' : String(v);
        }
      }
    }

    if (Object.keys($set).length === 0) {
      return apiJson(existing);
    }

    const updateResult = await collection.updateOne({ assetnumber }, { $set });
    if (updateResult.matchedCount === 0) {
      return apiJson({ error: 'Failed to update portable asset' }, { status: 500 });
    }

    const updated = await collection.findOne({ assetnumber });
    return apiJson(updated);
  } catch (error) {
    console.error('Error updating portable asset:', error);
    return apiJson(
      { error: 'Failed to update portable asset', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const { db } = await connectToDatabase();
    await db.collection(MOD).deleteMany({ assetnumber });

    const result = await db.collection(COLLECTION).deleteOne({ assetnumber });

    if (result.deletedCount === 0) {
      return apiJson({ error: 'Portable asset not found' }, { status: 404 });
    }

    return apiJson({ success: true });
  } catch (error) {
    console.error('Error deleting portable asset:', error);
    return apiJson({ error: 'Failed to delete portable asset' }, { status: 500 });
  }
}
