import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const asset = await db
      .collection('equipmentandtools')
      .findOne({ assetnumber: params.assetnumber });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(asset);
  } catch (err) {
    console.error('Failed to fetch asset:', err);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const updateData = await request.json();

    console.log('Processing update for asset:', assetnumber);

    const { db } = await connectToDatabase();

    // First check if the asset exists
    const existingAsset = await db.collection('equipmentandtools').findOne({ assetnumber });

    if (!existingAsset) {
      console.error('Asset not found in database:', assetnumber);
      return NextResponse.json(
        { error: `Asset ${assetnumber} not found` },
        { status: 404 }
      );
    }

    // Remove immutable and protected fields
    const {
      _id,
      assetnumber: _an,
      acquireddate,
      acquiredvalue,
      assetdescription,
      ...updateFields
    } = updateData;

    console.log('Updating asset with fields:', updateFields);

    const updatedAsset = await db.collection('equipmentandtools').findOneAndUpdate(
      { assetnumber: assetnumber.toString() }, // Ensure string comparison
      { $set: updateFields },
      { 
        returnDocument: 'after'
      }
    );

    if (!updatedAsset) {
      console.error('Update failed for asset:', assetnumber);
      return NextResponse.json(
        { error: 'Failed to update asset' },
        { status: 500 }
      );
    }

    console.log('Asset updated successfully:', updatedAsset);
    return NextResponse.json(updatedAsset);

  } catch (error) {
    console.error('Error in asset update:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('equipmentandtools').deleteOne({
      assetnumber: params.assetnumber
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Failed to delete asset:', err);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
