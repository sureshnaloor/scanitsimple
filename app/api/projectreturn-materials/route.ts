import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/auth';

function generateMaterialId(objectId: string): string {
  // Use a combination of timestamp and random parts for better uniqueness
  const hexString = objectId.replace(/^[0-9a-f]{8}/, '');
  const digits = hexString.replace(/[^0-9]/g, '');
  
  if (digits.length >= 10) {
    return digits.substring(0, 10);
  } else {
    // Extract all digits from ObjectId and add timestamp milliseconds for uniqueness
    const allDigits = objectId.replace(/[^0-9]/g, '');
    const timestamp = Date.now().toString();
    // Combine ObjectId digits with last few digits of timestamp
    const combined = (allDigits + timestamp.slice(-6)).replace(/[^0-9]/g, '');
    return combined.padEnd(10, '0').substring(0, 10);
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');
    const materialCode = searchParams.get('materialCode');
    const materialDescription = searchParams.get('materialDescription');
    const sourceProject = searchParams.get('sourceProject');
    const includeDisposed = searchParams.get('includeDisposed') === 'true';

    const { db } = await connectToDatabase();
    
    // Build query based on provided parameters
    const query: any = {};
    // Only exclude disposed materials if includeDisposed is not true
    if (!includeDisposed) {
      query.disposed = { $ne: true };
    }
    if (materialId?.trim()) {
      query.materialid = { $regex: materialId, $options: 'i' };
    }
    if (materialCode?.trim()) {
      query.materialCode = { $regex: materialCode, $options: 'i' };
    }
    if (materialDescription?.trim()) {
      query.materialDescription = { $regex: materialDescription, $options: 'i' };
    }
    if (sourceProject?.trim()) {
      query.sourceProject = sourceProject;
    }

    const materials = await db
      .collection('projreturnmaterials')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(materials);
  } catch (err) {
    console.error('Failed to fetch project return materials:', err);
    return NextResponse.json(
      { error: 'Failed to fetch project return materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Generate unique material ID with uniqueness check
    const objectId = new ObjectId();
    let materialId = generateMaterialId(objectId.toString());
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existingMaterial = await db.collection('projreturnmaterials').findOne({ materialid: materialId });
      if (!existingMaterial) {
        break; // Found unique ID
      }
      
      attempts++;
      // If duplicate found, generate new one with timestamp and random
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const combined = (timestamp.slice(-6) + random).padStart(10, '0').substring(0, 10);
      materialId = combined;
    }
    
    // Add metadata
    const materialData = {
      ...body,
      _id: objectId,
      materialid: materialId,
      pendingRequests: 0,
      disposed: false,
      createdBy: session.user.name || session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('projreturnmaterials').insertOne(materialData);
    
    return NextResponse.json({ ...result, materialId }, { status: 201 });
  } catch (err) {
    console.error('Failed to create project return material:', err);
    return NextResponse.json(
      { error: 'Failed to create project return material' },
      { status: 500 }
    );
  }
}
