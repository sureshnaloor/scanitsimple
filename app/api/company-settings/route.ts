// app/api/company-settings/route.ts
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'companysettings';

// GET - Retrieve company settings
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Find the first document (we only ever have one settings document)
    const settings = await db.collection(COLLECTION).findOne({});
    
    if (!settings) {
      // Return default initial placeholder settings
      return apiJson({
        name: 'GCC LABS COMPANY',
        address: 'Dammam',
        city: 'Dammam',
        country: 'Saudi Arabia',
        logo: ''
      });
    }
    
    return apiJson(settings);
  } catch (error) {
    console.error('Failed to fetch company settings:', error);
    return apiJson({ error: 'Failed to fetch company settings' }, { status: 500 });
  }
}

// POST - Update or create company settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, city, country, logo } = body;

    if (!name || !name.trim()) {
      return apiJson({ error: 'Company Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const payload = {
      name: String(name).trim(),
      address: String(address || '').trim(),
      city: String(city || '').trim(),
      country: String(country || '').trim(),
      logo: logo ? String(logo) : '', // Expecting base64 string
      updatedAt: new Date()
    };

    // Upsert the single document in the collection
    const existing = await db.collection(COLLECTION).findOne({});
    if (existing) {
      await db.collection(COLLECTION).updateOne(
        { _id: existing._id },
        { $set: payload }
      );
      return apiJson({ ...payload, _id: existing._id });
    } else {
      const result = await db.collection(COLLECTION).insertOne({
        ...payload,
        createdAt: new Date()
      });
      return apiJson({ ...payload, _id: result.insertedId });
    }
  } catch (error) {
    console.error('Failed to save company settings:', error);
    return apiJson({ error: 'Failed to save company settings' }, { status: 500 });
  }
}
