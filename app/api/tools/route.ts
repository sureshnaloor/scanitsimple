import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Function to generate 10-digit asset number from ObjectId
function generateAssetNumber(objectId: string): string {
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
    const { searchParams } = new URL(request.url);
    const assetNumber = searchParams.get('assetNumber');
    const toolDescription = searchParams.get('toolDescription');

    const { db } = await connectToDatabase();
    
    // Build query based on provided parameters
    const query: any = {};
    if (assetNumber?.trim()) {
      query.assetnumber = { $regex: assetNumber, $options: 'i' };
    }
    if (toolDescription?.trim()) {
      query.toolDescription = { $regex: toolDescription, $options: 'i' };
    }

    const tools = await db
      .collection('tools')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(tools);
  } catch (err) {
    console.error('Failed to fetch tools:', err);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Generate a new ObjectId for the tool
    const objectId = new ObjectId();
    const assetNumber = generateAssetNumber(objectId.toString());
    
    // Check if assetnumber already exists (very unlikely but good practice)
    const existingTool = await db.collection('tools').findOne({ assetnumber: assetNumber });
    if (existingTool) {
      // If exists, generate a new one by appending a suffix
      const newAssetNumber = assetNumber + Math.floor(Math.random() * 100).toString().padStart(2, '0');
      body.assetnumber = newAssetNumber;
    } else {
      body.assetnumber = assetNumber;
    }
    
    // Add metadata
    body._id = objectId;
    body.createdAt = new Date();
    body.updatedAt = new Date();
    
    const result = await db.collection('tools').insertOne(body);
    return NextResponse.json({ ...result, assetnumber: body.assetnumber }, { status: 201 });
  } catch (err) {
    console.error('Failed to create tool:', err);
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}
