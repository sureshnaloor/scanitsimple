import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNumber = searchParams.get('serialNumber');

    const { db, client } = await connectToDatabase();

    // Log database information
    console.log('Default database name:', db.databaseName);
    
    // Return empty array if serial number parameter is empty or null
    if (!serialNumber?.trim()) {
      return NextResponse.json([]);
    }
    
    // Build query: search for assetserialnumber containing the input string
    // and only return records that have the assetserialnumber field (not null/undefined/empty)
    const trimmedSerial = serialNumber.trim();
    
    console.log('Serial number search term:', trimmedSerial);
    console.log('Collection name: equipmentandtools');
    
    // Always use "equipment" database explicitly as requested
    const targetDb = client.db('equipment');
    console.log('Using database:', targetDb.databaseName);

    // First, let's find a record that actually has assetserialnumber field
    // Try to find by ObjectId first (the specific record you showed)
    const { ObjectId } = require('mongodb');
    let sampleRecord = null;
    
    try {
      sampleRecord = await targetDb.collection('equipmentandtools').findOne({ 
        _id: new ObjectId('675ebfdd78cd37af6aa123bd') 
      });
      if (sampleRecord) {
        console.log('Found record by ObjectId 675ebfdd78cd37af6aa123bd');
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log('Could not find record by ObjectId:', e.message);
      } else {
        console.log('Could not find record by ObjectId:', e);
      }
    }
    
    // If not found by ObjectId, try to find ANY record with a serial number field
    if (!sampleRecord) {
      console.log('Trying to find any record with serial number field...');
      // Try different field name variations
      const fieldVariations = ['assetserialnumber', 'assetSerialNumber', 'ASSETSERIALNUMBER', 'asset_serial_number'];
      for (const field of fieldVariations) {
        const testRecord = await targetDb.collection('equipmentandtools').findOne({ 
          [field]: { $exists: true, $nin: [null, ''] } 
        });
        if (testRecord) {
          sampleRecord = testRecord;
          console.log(`Found record with field "${field}"`);
          break;
        }
      }
    }
    
    // If still not found, get any record and check all its keys
    if (!sampleRecord) {
      sampleRecord = await targetDb.collection('equipmentandtools').findOne({ assetnumber: '503159' });
      if (sampleRecord) {
        console.log('Found record by assetnumber 503159 (but may not have serial number field)');
      }
    }
    
    if (sampleRecord) {
      console.log('Sample record found:');
      console.log('All keys in record:', Object.keys(sampleRecord));
      console.log('Full record:', JSON.stringify(sampleRecord, null, 2));
      
      // Check for any field that contains "serial" (case insensitive)
      const serialFields = Object.keys(sampleRecord).filter(key => 
        key.toLowerCase().includes('serial')
      );
      console.log('Fields containing "serial":', serialFields);
      
      if (serialFields.length > 0) {
        console.log('Found serial-related fields!');
        serialFields.forEach(field => {
          console.log(`  ${field}: ${sampleRecord[field]} (type: ${typeof sampleRecord[field]})`);
        });
      }
    } else {
      console.log('Sample record with assetnumber 503159 not found - checking collection...');
      const totalCount = await targetDb.collection('equipmentandtools').countDocuments({});
      console.log(`Total records in equipmentandtools collection: ${totalCount}`);
      if (totalCount > 0) {
        const anyRecord = await targetDb.collection('equipmentandtools').findOne({});
        console.log('Sample record keys:', Object.keys(anyRecord || {}));
        if (anyRecord) {
          // Check all keys that might be serial number related
          const serialKeys = Object.keys(anyRecord).filter(key => 
            key.toLowerCase().includes('serial')
          );
          console.log('Keys containing "serial":', serialKeys);
        }
      }
    }

    // The field name is confirmed to be "assetserialnumber" (lowercase, all one word)
    // Now search for records that have this field and match the serial number
    const fieldName = 'assetserialnumber';
    
    // First, check how many records have this field
    const countWithField = await targetDb.collection('equipmentandtools').countDocuments({
      [fieldName]: { $exists: true, $nin: [null, ''] }
    });
    console.log(`Total records with "${fieldName}" field: ${countWithField}`);
    
    // Query for records with assetserialnumber containing the search term
    const query: any = {
      [fieldName]: {
        $exists: true,
        $nin: [null, ''],
        $regex: trimmedSerial,
        $options: 'i'
      }
    };
    
    console.log('Search query:', JSON.stringify(query, null, 2));
    
    const assets = await targetDb.collection('equipmentandtools').find(query).toArray();
    console.log(`Found ${assets.length} assets matching serial number search`);
    
    // Log sample results if any found
    if (assets.length > 0) {
      console.log('Sample result:', {
        _id: assets[0]._id,
        assetnumber: assets[0].assetnumber,
        [fieldName]: assets[0][fieldName]
      });
    }

    // Client-side filtering to ensure we only return records with valid serial numbers
    const filteredAssets = assets.filter(asset => {
      const serial = asset.assetserialnumber;
      if (!serial || typeof serial !== 'string') {
        return false;
      }
      const serialTrimmed = serial.trim();
      if (serialTrimmed === '') {
        return false;
      }
      return serialTrimmed.toLowerCase().includes(trimmedSerial.toLowerCase());
    });

    console.log(`After client-side filtering: ${filteredAssets.length} assets`);
    if (filteredAssets.length > 0) {
      console.log('Sample asset:', {
        assetnumber: filteredAssets[0].assetnumber,
        [fieldName]: filteredAssets[0][fieldName],
        _id: filteredAssets[0]._id
      });
    } else if (assets.length > 0) {
      console.log('Sample asset from MongoDB (before filtering):', {
        assetnumber: assets[0].assetnumber,
        [fieldName]: assets[0][fieldName],
        [`${fieldName}Type`]: typeof assets[0][fieldName]
      });
    }

    return NextResponse.json(filteredAssets);
  } catch (err) {
    console.error('Failed to fetch MME by serial number:', err);
    return NextResponse.json(
      { error: 'Failed to fetch MME equipment' },
      { status: 500 }
    );
  }
}

