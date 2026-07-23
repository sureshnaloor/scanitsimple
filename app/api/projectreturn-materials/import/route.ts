import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import * as XLSX from 'xlsx';

// Function to generate 10-digit material ID from ObjectId
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

// Function to generate a unique material ID that doesn't exist in the database or in the current batch
async function generateUniqueMaterialId(db: any, existingIds: Set<string> = new Set()): Promise<string> {
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    const objectId = new ObjectId();
    let materialId = generateMaterialId(objectId.toString());
    
    // Check if this Material ID already exists in database or in current batch
    const existingInDb = await db.collection('projreturnmaterials').findOne({ materialid: materialId });
    
    if (!existingInDb && !existingIds.has(materialId)) {
      existingIds.add(materialId); // Add to set to prevent duplicates in same batch
      return materialId;
    }
    
    attempts++;
    // If duplicate found, generate new one with timestamp and random
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    // Use last 5 digits of timestamp + 5 random digits
    materialId = (timestamp.slice(-5) + random).padStart(10, '0').substring(0, 10);
    
    // Check again
    const existingWithNew = await db.collection('projreturnmaterials').findOne({ materialid: materialId });
    if (!existingWithNew && !existingIds.has(materialId)) {
      existingIds.add(materialId);
      return materialId;
    }
  }
  
  // Fallback: use timestamp-based ID with microsecond precision
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const fallbackId = (timestamp.slice(-4) + random).padStart(10, '0').substring(0, 10);
  existingIds.add(fallbackId);
  return fallbackId;
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const materials = [];
    const errors = [];
    const generatedMaterialIds = new Set<string>(); // Track IDs generated in this batch to avoid duplicates

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file type and parse accordingly
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let rows: any[] = [];

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        raw: false // Convert all values to strings for consistency
      });
      
      // Filter out completely empty rows
      rows = rows.filter((row: any) => {
        return row && row.some((cell: any) => {
          const cellStr = String(cell || '').trim();
          return cellStr !== '';
        });
      });
    } else {
      // Parse CSV file
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      rows = lines.map(line => {
        // Handle CSV with quoted fields
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });
    }

    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'File must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Get headers (first row)
    let headerRowIndex = 0;
    let headers: string[] = rows[0].map((h: any) => String(h).trim().toLowerCase());
    
    // Check if first row is actually headers (contains expected header keywords)
    const expectedHeaders = ['material', 'uom', 'quantity', 'source', 'project', 'po', 'issue', 'unit', 'rate', 'warehouse', 'location', 'yard', 'room', 'rack', 'bin', 'received', 'consignment', 'note', 'remarks'];
    const firstRowIsHeader = headers.some((h: string) => expectedHeaders.some((eh: string) => h.includes(eh)));
    
    // If first row doesn't look like headers, try second row (might have instruction row)
    if (!firstRowIsHeader && rows.length > 1) {
      const secondRow: string[] = rows[1].map((h: any) => String(h).trim().toLowerCase());
      const secondRowIsHeader = secondRow.some((h: string) => expectedHeaders.some((eh: string) => h.includes(eh)));
      if (secondRowIsHeader) {
        headerRowIndex = 1;
        headers = secondRow;
      }
    }
    
    // Expected headers mapping - all fields from the form
    const headerMapping: { [key: string]: string } = {
      'material code': 'materialCode',
      'materialcode': 'materialCode',
      'material_code': 'materialCode',
      'material description': 'materialDescription',
      'materialdescription': 'materialDescription',
      'material_description': 'materialDescription',
      'uom': 'uom',
      'quantity': 'quantity',
      'source project': 'sourceProject',
      'sourceproject': 'sourceProject',
      'source_project': 'sourceProject',
      'source po number': 'sourcePONumber',
      'sourceponumber': 'sourcePONumber',
      'source_po_number': 'sourcePONumber',
      'po number': 'sourcePONumber',
      'ponumber': 'sourcePONumber',
      'source issue number': 'sourceIssueNumber',
      'sourceissuenumber': 'sourceIssueNumber',
      'source_issue_number': 'sourceIssueNumber',
      'issue number': 'sourceIssueNumber',
      'issuenumber': 'sourceIssueNumber',
      'source unit rate': 'sourceUnitRate',
      'sourceunitrate': 'sourceUnitRate',
      'source_unit_rate': 'sourceUnitRate',
      'unit rate': 'sourceUnitRate',
      'unitrate': 'sourceUnitRate',
      'warehouse location': 'warehouseLocation',
      'warehouselocation': 'warehouseLocation',
      'warehouse_location': 'warehouseLocation',
      'warehouse': 'warehouseLocation',
      'location': 'warehouseLocation',
      'yard/room/rack-bin': 'yardRoomRackBin',
      'yardroomrackbin': 'yardRoomRackBin',
      'yard_room_rack_bin': 'yardRoomRackBin',
      'yard room rack bin': 'yardRoomRackBin',
      'yard room rack-bin': 'yardRoomRackBin',
      'received in warehouse date': 'receivedInWarehouseDate',
      'receivedinwarehousedate': 'receivedInWarehouseDate',
      'received_in_warehouse_date': 'receivedInWarehouseDate',
      'received date': 'receivedInWarehouseDate',
      'receiveddate': 'receivedInWarehouseDate',
      'consignment note number': 'consignmentNoteNumber',
      'consignmentnotenumber': 'consignmentNoteNumber',
      'consignment_note_number': 'consignmentNoteNumber',
      'consignment note': 'consignmentNoteNumber',
      'consignmentnote': 'consignmentNoteNumber',
      'remarks': 'remarks',
      'remark': 'remarks'
    };

    // Process data rows (skip header row and instruction row if present)
    const startRowIndex = headerRowIndex + 1;
    for (let i = startRowIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      // Skip if row is all empty
      const hasData = row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (!hasData) continue;

      const materialData: any = {};

      try {
        // Map headers to fields
        headers.forEach((header, index) => {
          const mappedField = headerMapping[header];
          if (mappedField && row[index] !== undefined && row[index] !== null) {
            const value = String(row[index]).trim();
            // Only set if value is not empty
            if (value !== '') {
              if (mappedField === 'quantity' || mappedField === 'sourceUnitRate') {
                materialData[mappedField] = parseFloat(value) || 0;
              } else if (mappedField === 'receivedInWarehouseDate') {
                // Parse date - handle various formats
                const dateValue = new Date(value);
                if (!isNaN(dateValue.getTime())) {
                  materialData[mappedField] = dateValue;
                }
              } else {
                materialData[mappedField] = value;
              }
            }
          }
        });

        // Validate required fields
        if (!materialData.materialCode) {
          errors.push(`Row ${i + 1}: Missing required field - Material Code`);
          continue;
        }
        if (!materialData.materialDescription) {
          errors.push(`Row ${i + 1}: Missing required field - Material Description`);
          continue;
        }
        if (!materialData.uom) {
          errors.push(`Row ${i + 1}: Missing required field - UOM`);
          continue;
        }
        if (materialData.quantity === undefined || materialData.quantity === null) {
          errors.push(`Row ${i + 1}: Missing required field - Quantity`);
          continue;
        }
        if (!materialData.sourceProject) {
          errors.push(`Row ${i + 1}: Missing required field - Source Project`);
          continue;
        }
        if (!materialData.warehouseLocation) {
          errors.push(`Row ${i + 1}: Missing required field - Warehouse Location`);
          continue;
        }
        if (!materialData.yardRoomRackBin) {
          errors.push(`Row ${i + 1}: Missing required field - Yard/Room/Rack-Bin`);
          continue;
        }

        // Generate unique material ID (checking both database and current batch)
        const objectId = new ObjectId();
        materialData.materialid = await generateUniqueMaterialId(db, generatedMaterialIds);
        materialData._id = objectId;
        materialData.createdBy = session.user.name || session.user.email;
        materialData.createdAt = new Date();
        materialData.updatedAt = new Date();
        materialData.testDocs = []; // Initialize empty array
        materialData.pendingRequests = 0; // Initialize pending requests to 0
        materialData.disposed = false; // Initialize disposed flag

        materials.push(materialData);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (materials.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid materials to import', 
          errors,
          debug: {
            headersFound: headers,
            totalRows: rows.length - 1, // Excluding header
            headerMapping: Object.keys(headerMapping)
          }
        },
        { status: 400 }
      );
    }

    // Insert materials into database
    const result = await db.collection('projreturnmaterials').insertMany(materials);

    return NextResponse.json({
      success: true,
      imported: result.insertedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('Failed to import project return materials:', err);
    return NextResponse.json(
      { error: 'Failed to import project return materials' },
      { status: 500 }
    );
  }
}

