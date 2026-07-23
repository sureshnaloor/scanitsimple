import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetNumber = searchParams.get('assetNumber');
    const type = searchParams.get('type'); // 'user' or 'warehouse'
    
    if (!assetNumber || !type) {
      return NextResponse.json({ error: 'Asset number and type are required' }, { status: 400 });
    }

    // Helper function to determine which collection/API to use based on first digit
    const getAssetCollection = (assetNum: string): 'equipmentandtools' | 'fixedassets' => {
      if (!assetNum) return 'equipmentandtools';
      const firstDigit = String(assetNum).charAt(0);
      // First digit 5 or 9: equipmentandtools, otherwise: fixedassets
      return (firstDigit === '5' || firstDigit === '9') ? 'equipmentandtools' : 'fixedassets';
    };

    const collection = getAssetCollection(assetNumber);
    const apiEndpoint = collection === 'equipmentandtools' 
      ? `/api/assets/${assetNumber}` 
      : `/api/fixedassets/${assetNumber}`;

    // Fetch asset details from the appropriate API endpoint
    const assetResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${apiEndpoint}`);
    let asset: any;
    if (assetResponse.ok) {
      asset = await assetResponse.json();
    } else {
      // Fallback: try to construct asset details by joining custody and asset collections
      try {
        const { db } = await connectToDatabase();
        // Prefer starting from custody to ensure we can find asset even if details are missing
        const agg = await db.collection('equipmentcustody')
          .aggregate([
            { $match: { assetnumber: assetNumber, custodyto: null } },
            {
              $lookup: {
                from: collection,
                let: { asset: '$assetnumber' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$assetnumber', '$$asset'] } } }
                ],
                as: 'assetDetails'
              }
            },
            { $unwind: { path: '$assetDetails', preserveNullAndEmptyArrays: true } },
            { $sort: { custodyfrom: -1 } },
            { $limit: 1 },
            {
              $project: {
                assetnumber: { $ifNull: ['$assetDetails.assetnumber', '$assetnumber'] },
                assetdescription: '$assetDetails.assetdescription',
                assetmodel: '$assetDetails.assetmodel',
                assetmanufacturer: '$assetDetails.assetmanufacturer',
                assetserialnumber: '$assetDetails.assetserialnumber',
                assetstatus: '$assetDetails.assetstatus',
                employeenumber: 1,
                warehouseCity: 1
              }
            }
          ]).toArray();
        if (!agg || agg.length === 0) {
          return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }
        asset = agg[0];
      } catch (e) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
    }

    // Fetch employee details if it's user equipment
    let employeeInfo = null;
    if (type === 'user') {
      try {
        console.log('Asset data:', asset);
        console.log('Looking for employee number:', asset.employeenumber);
        
        const employeeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users`);
        if (employeeResponse.ok) {
          const employees: Array<{ employeenumber: string; employeename: string }> = await employeeResponse.json();
          console.log('Available employees:', employees.length);
          
          // Try to find employee by employeenumber from asset or from custody records
          if (asset.employeenumber) {
            employeeInfo = employees.find((emp: { employeenumber: string }) => emp.employeenumber === asset.employeenumber);
          } else {
            // If asset doesn't have employeenumber, try to get it from custody records
            const { db } = await connectToDatabase();
            const custodyRecord = await db.collection('equipmentcustody')
              .findOne({ 
                assetnumber: assetNumber,
                custodyto: null 
              });
            
            if (custodyRecord && custodyRecord.employeenumber) {
              console.log('Found custody record with employee:', custodyRecord.employeenumber);
              employeeInfo = employees.find((emp: { employeenumber: string }) => emp.employeenumber === custodyRecord.employeenumber);
            }
          }
          
          console.log('Found employee info:', employeeInfo);
        }
      } catch (error) {
        console.log('Could not fetch employee details:', error);
      }
    }

    // Create PDF document
    const doc = new jsPDF();
    
    // Set up page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;

    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPMENT CUSTODY UNDERTAKING LETTER', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Add date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${currentDate}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 20;

    // Add equipment details section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPMENT DETAILS', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const equipmentDetails = [
      `Asset Number: ${asset.assetnumber || 'N/A'}`,
      `Description: ${asset.assetdescription || 'N/A'}`,
      `Model: ${asset.assetmodel || 'N/A'}`,
      `Manufacturer: ${asset.assetmanufacturer || 'N/A'}`,
      `Serial Number: ${asset.assetserialnumber || 'N/A'}`,
      `Status: ${asset.assetstatus || 'N/A'}`
    ];

    if (type === 'warehouse' && asset.warehouseCity) {
      equipmentDetails.push(`Warehouse Location: ${asset.warehouseCity}`);
    }

    if (type === 'user' && asset.employeenumber) {
      equipmentDetails.push(`Employee Number: ${asset.employeenumber}`);
    }

    equipmentDetails.forEach(detail => {
      doc.text(detail, margin, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Add undertaking text
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('UNDERTAKING', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const empNoText = employeeInfo?.employeenumber || '__________';
    const empNameText = employeeInfo?.employeename || '____________________';
    const introText = `I, employee number ${empNoText} name ${empNameText}, hereby acknowledge and undertake the following:`;
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, yPosition);
    yPosition += introLines.length * 6 + 10;
    
    const undertakingPoints = [
      '1. I confirm that the above-mentioned equipment is currently in our custody and possession.',
      '2. I verify that the equipment is in good working condition and all accessories are available.',
      '3. I undertake that the equipment will not be used if it is uncalibrated or out of calibration.',
      '4. Iconfirm that all accessories, manuals, and related documentation are present and accounted for.',
      '5. I acknowledge our responsibility for the proper care, maintenance, and security of the equipment.',
      '6. I agree to report any damage, malfunction, or loss of the equipment immediately to the appropriate authorities.',
      '7. I`  understand that any misuse or negligence may result in disciplinary action.'
    ];

    undertakingPoints.forEach(point => {
      const lines = doc.splitTextToSize(point, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 5;
    });

    yPosition += 15;

    // Add signature section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', margin, yPosition);
    yPosition += 20;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    if (type === 'user') {
      // User equipment - Employee and Asset Controller signatures
      doc.text('User Signature:', margin, yPosition);
      doc.text('Asset Controller Signature:', pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      
      doc.text('_________________________', margin, yPosition);
      doc.text('_________________________', pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      
      // Left (employee) name removed; keep right side
      doc.text('Name: _________________________', pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      
      // Left (employee) date removed; keep right side
      doc.text('Date: _________________________', pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 20;

      // Add employee information (always show with placeholders if missing)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee Number: ${employeeInfo?.employeenumber || '__________'}`, margin, yPosition);
      doc.text(`Employee Name: ${employeeInfo?.employeename || '____________________'}`, margin, yPosition + 8);
      yPosition += 20;
    } else {
      // Warehouse equipment - Warehouse Incharge and MME signatures
      doc.text('Warehouse Incharge Signature:', margin, yPosition);
      doc.text('MME Signature:', pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      
      doc.text('_________________________', margin, yPosition);
      doc.text('_________________________', pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      
      doc.text('Name: _________________________', margin, yPosition);
      doc.text('Name: _________________________', pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      
      doc.text('Date: _________________________', margin, yPosition);
      doc.text('Date: _________________________', pageWidth - margin, yPosition, { align: 'right' });
    }

    yPosition += 20;

    // Add footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const footerText1 = 'This undertaking letter serves as a formal acknowledgment of equipment custody and responsibility.';
    const footerText2 = 'Please retain a copy for your records.';
    
    doc.text(footerText1, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    doc.text(footerText2, pageWidth / 2, yPosition, { align: 'center' });

    // Generate PDF and return as Response
    const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    const filename = `Undertaking_Letter_${assetNumber}_${type}.pdf`;
    
    return new Response(pdfArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating undertaking letter:', error);
    return NextResponse.json({ error: 'Failed to generate undertaking letter' }, { status: 500 });
  }
}