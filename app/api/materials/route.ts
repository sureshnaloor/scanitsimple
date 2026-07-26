// app/api/materials/route.ts
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'materials';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const materials = await db.collection(COLLECTION)
      .find({})
      .sort({ code: 1 })
      .toArray();
    return apiJson(materials);
  } catch (error) {
    console.error('Failed to fetch materials:', error);
    return apiJson({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.code || !data.description) {
      return apiJson({ error: 'code and description required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check for duplicate code
    const existing = await db.collection(COLLECTION).findOne({ code: data.code });
    if (existing) {
      return apiJson({ error: 'Material with this code already exists' }, { status: 409 });
    }

    const doc = {
      code: String(data.code).trim(),
      description: String(data.description).trim(),
      baseUOM: String(data.baseUOM || '').trim(),
      orderUOM: String(data.orderUOM || '').trim(),
      skuUOM: String(data.skuUOM || '').trim(),
      longText: String(data.longText || '').trim(),
      materialType: String(data.materialType || '').trim(),
      materialGroup: String(data.materialGroup || '').trim(),
      mrpRelevant: Boolean(data.mrpRelevant),
      specialStock: Boolean(data.specialStock),
      remarks: String(data.remarks || '').trim(),
      status: data.status === 'inventory' ? 'inventory' : 'stock',
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    return apiJson({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create material:', error);
    return apiJson({ error: 'Failed to create material' }, { status: 500 });
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
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return apiJson({ error: 'Material not found' }, { status: 404 });
    }
    return apiJson(result);
  } catch (error) {
    console.error('Failed to update material:', error);
    return apiJson({ error: 'Failed to update material' }, { status: 500 });
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
    console.error('Failed to delete material:', error);
    return apiJson({ error: 'Failed to delete material' }, { status: 500 });
  }
}
