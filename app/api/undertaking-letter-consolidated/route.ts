import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeNumber = searchParams.get('employeeNumber');
    
    if (!employeeNumber) {
      return NextResponse.json({ error: 'Employee number is required' }, { status: 400 });
    }

    // Fetch employee details
    const employeeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users`);
    if (!employeeResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch employee data' }, { status: 500 });
    }
    const employees: Array<{ employeenumber: string; employeename: string; department?: string; position?: string }> = await employeeResponse.json();
    const employee = employees.find(emp => emp.employeenumber === employeeNumber);
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch user equipment list with full details
    const { db } = await connectToDatabase();
    
    const equipmentData = await db.collection('equipmentcustody')
      .aggregate([
        {
          $match: {
            employeenumber: employeeNumber,
            custodyto: null
          }
        },
        {
          // Lookup from both collections in parallel
          $lookup: {
            from: 'equipmentandtools',
            let: { asset: '$assetnumber' },
            pipeline: [
              { $match: { $expr: { $eq: ['$assetnumber', '$$asset'] } } }
            ],
            as: 'equipmentDetails'
          }
        },
        {
          $lookup: {
            from: 'fixedassets',
            let: { asset: '$assetnumber' },
            pipeline: [
              { $match: { $expr: { $eq: ['$assetnumber', '$$asset'] } } }
            ],
            as: 'fixedAssetDetails'
          }
        },
        {
          // Determine which collection to use based on first digit and pick the correct details
          $addFields: {
            firstDigit: { $substr: [{ $toString: '$assetnumber' }, 0, 1] }
          }
        },
        {
          $addFields: {
            assetDetails: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$firstDigit', '5'] },
                    { $eq: ['$firstDigit', '9'] }
                  ]
                },
                then: { $arrayElemAt: ['$equipmentDetails', 0] },
                else: { $arrayElemAt: ['$fixedAssetDetails', 0] }
              }
            }
          }
        },
        {
          $project: {
            assetnumber: { $ifNull: ['$assetDetails.assetnumber', '$assetnumber'] },
            assetdescription: '$assetDetails.assetdescription',
            assetstatus: '$assetDetails.assetstatus',
            assetmodel: '$assetDetails.assetmodel',
            assetmanufacturer: '$assetDetails.assetmanufacturer',
            assetserialnumber: '$assetDetails.assetserialnumber',
            custodyfrom: 1,
            project: 1
          }
        },
        {
          $sort: {
            assetnumber: 1
          }
        }
      ]).toArray();
    
    if (!equipmentData || equipmentData.length === 0) {
      return NextResponse.json({ error: 'No equipment found for this employee' }, { status: 404 });
    }

    // Create PDF document
    const doc = new jsPDF();
    
    // Set up page dimensions with reduced margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15; // Reduced from 20
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;

    // Add header with smaller font
    doc.setFontSize(16); // Reduced from 18
    doc.setFont('helvetica', 'bold');
    doc.text('CONSOLIDATED EQUIPMENT CUSTODY UNDERTAKING LETTER', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12; // Reduced from 20

    // Add date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.setFontSize(10); // Reduced from 12
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${currentDate}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 12; // Reduced from 20

    // Add employee information with reduced spacing
    doc.setFontSize(12); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE INFORMATION', margin, yPosition);
    yPosition += 8; // Reduced from 15
    
    doc.setFontSize(10); // Reduced from 12
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee Number: ${employee.employeenumber}`, margin, yPosition);
    yPosition += 5; // Reduced from 8
    doc.text(`Employee Name: ${employee.employeename}`, margin, yPosition);
    yPosition += 5; // Reduced from 8
    doc.text(`Department: ${employee.department || 'N/A'}`, margin, yPosition);
    yPosition += 5; // Reduced from 8
    doc.text(`Position: ${employee.position || 'N/A'}`, margin, yPosition);
    yPosition += 12; // Reduced from 20

    // Add equipment list section with compact layout
    doc.setFontSize(12); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPMENT UNDER CUSTODY', margin, yPosition);
    yPosition += 8; // Reduced from 15

    // Create equipment table with smaller fonts
    const tableHeaders = ['Asset Number', 'Description', 'Model', 'Manufacturer', 'Status', 'Custody From'];
    const colWidths = [25, 45, 30, 35, 20, 25];
    const startX = margin;
    
    // Table headers
    doc.setFontSize(8); // Reduced from 10
    doc.setFont('helvetica', 'bold');
    let xPosition = startX;
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 5; // Reduced from 8

    // Draw header line
    doc.line(startX, yPosition - 2, startX + colWidths.reduce((a, b) => a + b, 0), yPosition - 2);
    yPosition += 3; // Reduced from 5

    // Table data with dynamic row height for wrapped text
    doc.setFont('helvetica', 'normal');
    const lineHeight = 5; // compact line height used in table rows
    equipmentData.forEach((item) => {
      const rowData = [
        item.assetnumber || 'N/A',
        item.assetdescription || 'N/A',
        item.assetmodel || 'N/A',
        item.assetmanufacturer || 'N/A',
        item.assetstatus || 'N/A',
        new Date(item.custodyfrom).toLocaleDateString()
      ];

      // Measure wrapped lines per column to determine row height
      const wrappedPerCol: Array<string[] | string> = rowData.map((data, colIndex) =>
        doc.splitTextToSize(String(data), colWidths[colIndex] - 2)
      );
      const maxLines = wrappedPerCol.reduce((max, lines) => {
        const count = Array.isArray(lines) ? lines.length : 1;
        return Math.max(max, count);
      }, 1);
      const rowHeight = maxLines * lineHeight + 2; // +2 for extra margin between rows

      // Page break if the row would overflow
      if (yPosition + rowHeight > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Render the row
      xPosition = startX;
      wrappedPerCol.forEach((lines, colIndex) => {
        doc.text(lines as string[] | string, xPosition + 1, yPosition);
        xPosition += colWidths[colIndex];
      });

      // Advance y by computed row height
      yPosition += rowHeight;
    });

    yPosition += 8; // Reduced from 15

    // Add undertaking text with compact spacing
    doc.setFontSize(12); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.text('UNDERTAKING', margin, yPosition);
    yPosition += 8; // Reduced from 15
    
    doc.setFontSize(10); // Reduced from 12
    doc.setFont('helvetica', 'normal');
    
    const introText = `I, employee number ${employee.employeenumber} name ${employee.employeename}, hereby acknowledge and undertake the following regarding all equipment listed above:`;
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, yPosition);
    yPosition += introLines.length * 4 + 6; // Reduced spacing
    
    const undertakingPoints = [
      '1. I confirm that all the above-mentioned equipment is currently in my custody and possession.',
      '2. I verify that all equipment is in good working condition and all accessories are available.',
      '3. I undertake that no equipment will be used if it is uncalibrated or out of calibration.',
      '4. I confirm that all accessories, manuals, and related documentation are present and accounted for.',
      '5. I acknowledge my responsibility for the proper care, maintenance, and security of all equipment.',
      '6. I agree to report any damage, malfunction, or loss of any equipment immediately to the appropriate authorities.',
      '7. I understand that any misuse or negligence may result in disciplinary action.',
      '8. I acknowledge that this undertaking covers all equipment currently under my custody as listed above.'
    ];

    undertakingPoints.forEach(point => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) { // Reduced from 40
        doc.addPage();
        yPosition = margin;
      }
      
      const lines = doc.splitTextToSize(point, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4 + 3; // Reduced spacing
    });

    yPosition += 8; // Reduced from 15

    // Add signature section with compact spacing
    doc.setFontSize(12); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', margin, yPosition);
    yPosition += 12; // Reduced from 20

    doc.setFontSize(10); // Reduced from 12
    doc.setFont('helvetica', 'normal');
    
    // Employee and Asset Controller signatures
    doc.text('Employee Signature:', margin, yPosition);
    doc.text('Asset Controller Signature:', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10; // Reduced from 15
    
    doc.text('_________________________', margin, yPosition);
    doc.text('_________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10; // Reduced from 15
    
    // Left (employee) name removed; keep right side
    doc.text('Name: _________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10; // Reduced from 15
    
    // Left (employee) date removed; keep right side
    doc.text('Date: _________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 12; // Reduced from 20

    // Add employee information
    doc.setFontSize(9); // Reduced from 10
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee Number: ${employee.employeenumber}`, margin, yPosition);
    doc.text(`Employee Name: ${employee.employeename}`, margin, yPosition + 6); // Reduced from 8
    yPosition += 12; // Reduced from 20

    // Add footer
    doc.setFontSize(9); // Reduced from 10
    doc.setFont('helvetica', 'normal');
    const footerText1 = 'This consolidated undertaking letter serves as a formal acknowledgment of equipment custody and responsibility for all listed equipment.';
    const footerText2 = 'Please retain a copy for your records.';
    
    doc.text(footerText1, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6; // Reduced from 8
    doc.text(footerText2, pageWidth / 2, yPosition, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `Consolidated_Undertaking_Letter_${employee.employeenumber}_${employee.employeename.replace(/\s+/g, '_')}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating consolidated undertaking letter:', error);
    return NextResponse.json({ error: 'Failed to generate consolidated undertaking letter' }, { status: 500 });
  }
}
