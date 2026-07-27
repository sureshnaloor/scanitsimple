// app/api/custom-masters/[id]/route.ts
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'custommasters';

// PUT - Update a custom master list
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, values } = await request.json();

    if (!name || !name.trim()) {
      return apiJson({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const valueArray = Array.isArray(values) 
      ? values.map(v => String(v).trim()).filter(Boolean)
      : [];

    const normalizedName = String(name).trim();
    const key = `custom-${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;

    // Verify it exists
    const existing = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return apiJson({ error: 'Custom master not found' }, { status: 404 });
    }

    // Check if key is used by another record
    const duplicate = await db.collection(COLLECTION).findOne({ 
      key, 
      _id: { $ne: new ObjectId(id) } 
    });
    if (duplicate) {
      return apiJson({ error: `Another master list named "${normalizedName}" already exists.` }, { status: 400 });
    }

    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          name: normalizedName,
          key,
          values: valueArray,
          updatedAt: new Date()
        } 
      }
    );

    return apiJson({ success: true });
  } catch (error) {
    console.error('Failed to update custom master:', error);
    return apiJson({ error: 'Failed to update custom master' }, { status: 500 });
  }
}

// DELETE - Delete a custom master list
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();

    const record = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!record) {
      return apiJson({ error: 'Custom master not found' }, { status: 404 });
    }

    // Optional safety: we could check if any customfielddefs are currently using this key, but let's delete directly
    await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return apiJson({ success: true });
  } catch (error) {
    console.error('Failed to delete custom master:', error);
    return apiJson({ error: 'Failed to delete custom master' }, { status: 500 });
  }
}
