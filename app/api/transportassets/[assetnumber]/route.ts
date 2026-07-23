import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const COLLECTION = 'transportasset';

export async function GET(
  _request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const asset = await db.collection(COLLECTION).findOne({ assetnumber: params.assetnumber });

    if (!asset) {
      return NextResponse.json({ error: 'Transport asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Failed to fetch transport asset:', error);
    return NextResponse.json({ error: 'Failed to fetch transport asset' }, { status: 500 });
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
      return NextResponse.json({ error: `Transport asset ${assetnumber} not found` }, { status: 404 });
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
      'plateNumber',
      'chassisNumber',
      'engineNumber',
      'vehicleModel',
      'modelYear',
      'trackerSerialNumber',
      'trackerMake',
      'trackerModel',
      'trackerInstalledDate',
      'simSubscriptionStartDate',
      'trackerDeinstallDate',
      'trackerRemarks'
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
              return NextResponse.json({ error: 'Acquired Value must be a valid number.' }, { status: 400 });
            }
            $set[key] = n;
          }
        } else if (
          key === 'acquireddate' ||
          key === 'trackerInstalledDate' ||
          key === 'simSubscriptionStartDate' ||
          key === 'trackerDeinstallDate'
        ) {
          if (v === null || v === undefined || v === '') {
            $set[key] = null;
          } else {
            const d = new Date(String(v));
            if (Number.isNaN(d.getTime())) {
              return NextResponse.json({ error: `Invalid date for ${key}.` }, { status: 400 });
            }
            $set[key] = d;
          }
        } else if (key === 'modelYear') {
          if (v === null || v === undefined || v === '') {
            $set[key] = null;
          } else {
            const y = Number(v);
            if (Number.isNaN(y)) {
              return NextResponse.json({ error: 'Model year must be a valid number.' }, { status: 400 });
            }
            $set[key] = y;
          }
        } else {
          $set[key] = v === null || v === undefined ? '' : String(v);
        }
      }
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json(existing);
    }

    const updateResult = await collection.updateOne({ assetnumber }, { $set });
    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update transport asset' }, { status: 500 });
    }

    const updated = await collection.findOne({ assetnumber });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating transport asset:', error);
    return NextResponse.json(
      { error: 'Failed to update transport asset', details: error instanceof Error ? error.message : String(error) },
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

    await db.collection('transport_maint_record_preventive').deleteMany({ assetnumber });
    await db.collection('transport_maint_record_breakdown').deleteMany({ assetnumber });

    const result = await db.collection(COLLECTION).deleteOne({ assetnumber });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Transport asset not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transport asset:', error);
    return NextResponse.json({ error: 'Failed to delete transport asset' }, { status: 500 });
  }
}
