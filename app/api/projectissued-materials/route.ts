import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/auth';

// Function to generate 10-digit material ID from ObjectId
function generateMaterialId(objectId: string): string {
  // Remove the ObjectId prefix and take first 10 digits
  const hexString = objectId.replace(/^[0-9a-f]{8}/, ''); // Remove first 8 chars
  const digits = hexString.replace(/[^0-9]/g, ''); // Keep only digits
  
  // If we don't have enough digits, pad with zeros or use the original ObjectId
  if (digits.length >= 10) {
    return digits.substring(0, 10);
  } else {
    // Use the ObjectId string and extract digits, pad if needed
    const allDigits = objectId.replace(/[^0-9]/g, '');
    return allDigits.padEnd(10, '0').substring(0, 10);
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

    const { db } = await connectToDatabase();
    
    // Build query based on provided parameters
    const query: any = {};
    if (materialId?.trim()) {
      query.materialid = { $regex: materialId, $options: 'i' };
    }
    if (materialCode?.trim()) {
      query.materialCode = { $regex: materialCode, $options: 'i' };
    }
    if (materialDescription?.trim()) {
      query.materialDescription = { $regex: materialDescription, $options: 'i' };
    }

    const materials = await db
      .collection('projectissuedmaterials')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(materials);
  } catch (err) {
    console.error('Failed to fetch project issued materials:', err);
    return NextResponse.json(
      { error: 'Failed to fetch project issued materials' },
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
    
    // Generate a new ObjectId for the material
    const objectId = new ObjectId();
    
    // Generate unique material ID with uniqueness check
    let materialId = generateMaterialId(objectId.toString());
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existingMaterial = await db.collection('projectissuedmaterials').findOne({ materialid: materialId });
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
    
    body.materialid = materialId;
    
    // Add metadata with user information
    body._id = objectId;
    body.pendingRequests = 0; // Initialize pending requests to 0
    body.createdBy = session.user.name || session.user.email; // Use name if available, fallback to email
    body.createdAt = new Date();
    body.updatedAt = new Date();
    
    const result = await db.collection('projectissuedmaterials').insertOne(body);
    return NextResponse.json({ ...result, materialid: body.materialid }, { status: 201 });
  } catch (err) {
    console.error('Failed to create project issued material:', err);
    return NextResponse.json(
      { error: 'Failed to create project issued material' },
      { status: 500 }
    );
  }
}
