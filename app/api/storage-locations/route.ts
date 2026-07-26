// app/api/storage-locations/route.ts
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'storagelocations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { db } = await connectToDatabase();
    if (id) {
      const record = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
      return apiJson(record);
    }

    const records = await db.collection(COLLECTION)
      .find({})
      .sort({ name: 1 })
      .toArray();
    return apiJson(records);
  } catch (error) {
    console.error('Failed to fetch storage locations:', error);
    return apiJson({ error: 'Failed to fetch storage locations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name || !data.incharge) {
      return apiJson({ error: 'Warehouse name and incharge person are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check duplicate name
    const existing = await db.collection(COLLECTION).findOne({
      name: { $regex: `^${String(data.name).trim()}$`, $options: 'i' }
    });
    if (existing) {
      return apiJson({ error: 'Storage location with this name already exists' }, { status: 409 });
    }

    const doc = {
      name: String(data.name).trim(),
      incharge: String(data.incharge).trim(),
      remarks: String(data.remarks || '').trim(),
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    return apiJson({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create storage location:', error);
    return apiJson({ error: 'Failed to create storage location' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data._id) {
      return apiJson({ error: '_id is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const { _id, ...updateFields } = data;

    // Check duplicate name on rename
    if (updateFields.name) {
      const existing = await db.collection(COLLECTION).findOne({
        _id: { $ne: new ObjectId(_id) },
        name: { $regex: `^${String(updateFields.name).trim()}$`, $options: 'i' }
      });
      if (existing) {
        return apiJson({ error: 'Another storage location with this name already exists' }, { status: 409 });
      }
    }

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return apiJson({ error: 'Storage location not found' }, { status: 404 });
    }
    return apiJson(result);
  } catch (error) {
    console.error('Failed to update storage location:', error);
    return apiJson({ error: 'Failed to update storage location' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiJson({ error: 'id required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return apiJson(result);
  } catch (error) {
    console.error('Failed to delete storage location:', error);
    return apiJson({ error: 'Failed to delete storage location' }, { status: 500 });
  }
}
