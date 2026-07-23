import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/auth';
import * as XLSX from 'xlsx';

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
    const issues = [];
    const errors = [];

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
      // Use raw option to get exact cell values, then convert to array of arrays
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
    const expectedHeaders = ['material', 'drawing', 'equipment', 'room', 'requestor', 'quantity', 'issuer', 'issue', 'remarks'];
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
    
    // Log headers for debugging
    console.log('Found headers:', headers);
    
    // Header mapping - flexible to handle various header formats
    const headerMapping: { [key: string]: string } = {
      'material id': 'materialid',
      'materialid': 'materialid',
      'material_id': 'materialid',
      'drawing number': 'drawingNumber',
      'drawingnumber': 'drawingNumber',
      'drawing_number': 'drawingNumber',
      'equipment': 'equipment',
      'room': 'room',
      'requestor name': 'requestorName',
      'requestorname': 'requestorName',
      'requestor_name': 'requestorName',
      'quantity requested': 'qtyRequested',
      'qtyrequested': 'qtyRequested',
      'qty requested': 'qtyRequested',
      'quantity_requested': 'qtyRequested',
      'issuer name': 'issuerName',
      'issuername': 'issuerName',
      'issuer_name': 'issuerName',
      'issue quantity': 'issueQuantity',
      'issuequantity': 'issueQuantity',
      'issue_quantity': 'issueQuantity',
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

      const issueData: any = {};

      try {
        // Map headers to fields
        headers.forEach((header, index) => {
          const mappedField = headerMapping[header];
          if (mappedField && row[index] !== undefined && row[index] !== null) {
            const value = String(row[index]).trim();
            // Only set if value is not empty
            if (value !== '') {
              if (mappedField === 'qtyRequested' || mappedField === 'issueQuantity') {
                issueData[mappedField] = parseFloat(value) || 0;
              } else {
                issueData[mappedField] = value;
              }
            }
          }
        });
        
        // Log issue data for debugging
        console.log(`Row ${i + 1} parsed data:`, issueData);

        // Validate required fields
        if (!issueData.materialid) {
          errors.push(`Row ${i + 1}: Missing required field - Material ID`);
          continue;
        }
        if (!issueData.drawingNumber) {
          errors.push(`Row ${i + 1}: Missing required field - Drawing Number`);
          continue;
        }
        if (!issueData.equipment) {
          errors.push(`Row ${i + 1}: Missing required field - Equipment`);
          continue;
        }
        if (!issueData.room) {
          errors.push(`Row ${i + 1}: Missing required field - Room`);
          continue;
        }
        if (!issueData.requestorName) {
          errors.push(`Row ${i + 1}: Missing required field - Requestor Name`);
          continue;
        }
        if (!issueData.issuerName) {
          errors.push(`Row ${i + 1}: Missing required field - Issuer Name`);
          continue;
        }
        if (issueData.qtyRequested === undefined || issueData.qtyRequested === null) {
          errors.push(`Row ${i + 1}: Missing required field - Quantity Requested`);
          continue;
        }
        if (issueData.issueQuantity === undefined || issueData.issueQuantity === null) {
          errors.push(`Row ${i + 1}: Missing required field - Issue Quantity`);
          continue;
        }

        // Validate that material exists
        const material = await db.collection('projectissuedmaterials').findOne({ 
          materialid: issueData.materialid 
        });
        
        if (!material) {
          errors.push(`Row ${i + 1}: Material ID "${issueData.materialid}" not found`);
          continue;
        }

        // Validate that issue quantity doesn't exceed available quantity
        // Note: We'll check this again during actual insertion to handle concurrent updates
        if (issueData.issueQuantity > material.quantity) {
          errors.push(`Row ${i + 1}: Issue quantity (${issueData.issueQuantity}) exceeds available quantity (${material.quantity}) for Material ID "${issueData.materialid}"`);
          continue;
        }

        // Set default values
        issueData._id = new ObjectId();
        issueData.issueDate = new Date();
        issueData.createdBy = session.user.name || session.user.email;
        issueData.createdAt = new Date();

        issues.push(issueData);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (issues.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid material issues to import', 
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

    // Insert issues into database and update material quantities
    // Use a transaction-like approach for each issue
    let insertedCount = 0;
    const failedIssues = [];

    for (const issue of issues) {
      try {
        // Re-validate material availability (in case it changed)
        const material = await db.collection('projectissuedmaterials').findOne({ 
          materialid: issue.materialid 
        });
        
        if (!material) {
          failedIssues.push(`Material ID "${issue.materialid}" not found during insertion`);
          continue;
        }

        if (issue.issueQuantity > material.quantity) {
          failedIssues.push(`Material ID "${issue.materialid}": Issue quantity exceeds available quantity`);
          continue;
        }

        // Insert issue
        await db.collection('materialissues').insertOne(issue);
        
        // Update material quantity
        await db.collection('projectissuedmaterials').updateOne(
          { materialid: issue.materialid },
          { 
            $inc: { quantity: -issue.issueQuantity },
            $set: { updatedAt: new Date() }
          }
        );
        
        insertedCount++;
      } catch (error) {
        failedIssues.push(`Material ID "${issue.materialid}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: insertedCount,
      total: issues.length,
      errors: errors.length > 0 ? errors : undefined,
      failedIssues: failedIssues.length > 0 ? failedIssues : undefined
    });

  } catch (err) {
    console.error('Failed to import material issues:', err);
    return NextResponse.json(
      { error: 'Failed to import material issues' },
      { status: 500 }
    );
  }
}

