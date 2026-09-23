import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import * as XLSX from 'xlsx';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiJson({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    if (!rawData || rawData.length === 0) {
      return apiJson({ success: false, error: 'The uploaded file is empty' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('non_users');

    let insertedCount = 0;
    let updatedCount = 0;
    const now = new Date();

    for (const row of rawData) {
      const fullName = String(row['Full Name'] || row['fullName'] || row['Name'] || '').trim();
      if (!fullName) continue;

      const nationalId = String(row['National ID'] || row['nationalId'] || '').trim();
      const serialNumber = String(row['Company Serial Number'] || row['Serial Number'] || row['serialNumber'] || '').trim();
      const passportNumber = String(row['Passport Number'] || row['passportNumber'] || '').trim();
      const address = String(row['Address'] || row['address'] || '').trim();
      const phone = String(row['Phone'] || row['phone'] || '').trim();
      const email = String(row['Email'] || row['email'] || '').trim();
      const category = String(row['Category'] || row['category'] || 'Visitor').trim();
      const activeStr = String(row['Active'] || row['active'] || 'Y').trim().toUpperCase();
      const active = activeStr === 'N' ? 'N' : 'Y';

      // Check if matching document exists (by nationalId or serialNumber or fullName)
      let existing = null;
      if (nationalId) {
        existing = await collection.findOne({ nationalId });
      } else if (serialNumber) {
        existing = await collection.findOne({ serialNumber });
      } else if (passportNumber) {
        existing = await collection.findOne({ passportNumber });
      }

      const docData = {
        fullName,
        nationalId,
        serialNumber,
        passportNumber,
        address,
        phone,
        email,
        category,
        active,
        updatedAt: now,
      };

      if (existing) {
        await collection.updateOne({ _id: existing._id }, { $set: docData });
        updatedCount++;
      } else {
        await collection.insertOne({ ...docData, createdAt: now });
        insertedCount++;
      }
    }

    return apiJson({
      success: true,
      message: `Bulk import completed successfully. Inserted: ${insertedCount}, Updated: ${updatedCount}`,
      data: { insertedCount, updatedCount, totalProcessed: rawData.length },
    });
  } catch (error) {
    console.error('Error in non-user bulk import:', error);
    return apiJson(
      { success: false, error: error instanceof Error ? error.message : 'Bulk import failed' },
      { status: 500 }
    );
  }
}
