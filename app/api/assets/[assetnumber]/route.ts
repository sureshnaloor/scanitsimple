import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

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
      return apiJson(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return apiJson(asset);
  } catch (err) {
    console.error('Failed to fetch asset:', err);
    return apiJson(
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
      return apiJson(
        { error: `Asset ${assetnumber} not found` },
        { status: 404 }
      );
    }

    // Remove immutable and protected fields (assetnumber/_id can never change;
    // everything else is editable by admins via the row-edit dialog)
    const {
      _id,
      assetnumber: _an,
      ...updateFields
    } = updateData;

    // Coerce basic numeric/date fields when present
    if (Object.prototype.hasOwnProperty.call(updateFields, 'acquiredvalue')) {
      const num = Number(updateFields.acquiredvalue);
      updateFields.acquiredvalue = Number.isNaN(num) ? null : num;
    }
    if (Object.prototype.hasOwnProperty.call(updateFields, 'acquireddate')) {
      const d = new Date(updateFields.acquireddate);
      updateFields.acquireddate = Number.isNaN(d.getTime()) ? null : d;
    }

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
      return apiJson(
        { error: 'Failed to update asset' },
        { status: 500 }
      );
    }

    console.log('Asset updated successfully:', updatedAsset);
    return apiJson(updatedAsset);

  } catch (error) {
    console.error('Error in asset update:', error);
    return apiJson(
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
      return apiJson(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return apiJson(result);
  } catch (err) {
    console.error('Failed to delete asset:', err);
    return apiJson(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
