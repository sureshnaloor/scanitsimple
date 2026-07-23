import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Handle both MongoDB ID and full project identifier
    let projectIdentifier = decodeURIComponent(projectId);
    let project: any;
    
    console.log('Received projectId:', projectId);
    console.log('Decoded projectIdentifier:', projectIdentifier);
    
    // Check if it's a MongoDB ID (24 character hex string) or full project identifier
    if (/^[0-9a-fA-F]{24}$/.test(projectIdentifier)) {
      // It's a MongoDB ID, fetch project details
      console.log('Detected MongoDB ID, fetching project details...');
      const projectResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/projects`);
      if (!projectResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch project data' }, { status: 500 });
      }
      const projects: Array<{ _id: string; wbs: string; projectname: string; status?: string }> = await projectResponse.json();
      const foundProject = projects.find(proj => proj._id === projectIdentifier);
      
      if (!foundProject) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      
      // Create full project identifier
      projectIdentifier = `${foundProject.wbs} - ${foundProject.projectname}`;
      project = {
        wbs: foundProject.wbs,
        projectname: foundProject.projectname,
        status: foundProject.status || 'Active'
      };
      console.log('Created project identifier from MongoDB ID:', projectIdentifier);
    } else {
      // It's a full project identifier, parse it
      console.log('Detected full project identifier, parsing...');
      const parts = projectIdentifier.split(' - ');
      const wbs = parts[0];
      const projectName = parts.slice(1).join(' - '); // In case project name contains ' - '
      
      console.log('Parsed WBS:', wbs);
      console.log('Parsed project name:', projectName);
      
      // Create a project object for the PDF
      project = {
        wbs: wbs,
        projectname: projectName,
        status: 'Active' // Default status
      };
    }

    // Fetch project equipment list with full details
    const { db } = await connectToDatabase();
    
    const equipmentData = await db.collection('equipmentcustody')
      .aggregate([
        {
          $match: {
            project: projectIdentifier,
            custodyto: null
          }
        },
        {
          $lookup: {
            from: 'equipmentandtools',
            localField: 'assetnumber',
            foreignField: 'assetnumber',
            as: 'equipmentDetails'
          }
        },
        {
          $unwind: '$equipmentDetails'
        },
        {
          $project: {
            assetnumber: '$equipmentDetails.assetnumber',
            assetdescription: '$equipmentDetails.assetdescription',
            assetstatus: '$equipmentDetails.assetstatus',
            assetmodel: '$equipmentDetails.assetmodel',
            assetmanufacturer: '$equipmentDetails.assetmanufacturer',
            assetserialnumber: '$equipmentDetails.assetserialnumber',
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
      return NextResponse.json({ error: 'No equipment found for this project' }, { status: 404 });
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
    doc.text('CONSOLIDATED PROJECT EQUIPMENT CUSTODY UNDERTAKING LETTER', pageWidth / 2, yPosition, { align: 'center' });
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

    // Add project information with reduced spacing
    doc.setFontSize(12); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT INFORMATION', margin, yPosition);
    yPosition += 8; // Reduced from 15
    
    doc.setFontSize(10); // Reduced from 12
    doc.setFont('helvetica', 'normal');
    doc.text(`Project Name: ${project.projectname}`, margin, yPosition);
    yPosition += 5; // Reduced from 8
    doc.text(`WBS Code: ${project.wbs || 'N/A'}`, margin, yPosition);
    yPosition += 5; // Reduced from 8
    doc.text(`Project Status: ${project.status || 'N/A'}`, margin, yPosition);
    yPosition += 12; // Reduced from 20

    // Add equipment list section with compact layout
    doc.setFontSize(12); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPMENT UNDER PROJECT CUSTODY', margin, yPosition);
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
    
    const introText = `I, project in-charge of ${project.projectname}, hereby acknowledge and undertake the following regarding all equipment listed above:`;
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, yPosition);
    yPosition += introLines.length * 4 + 6; // Reduced spacing
    
    const undertakingPoints = [
      '1. I confirm that all the above-mentioned equipment is currently under project custody and possession.',
      '2. I verify that all equipment is in good working condition and all accessories are available.',
      '3. I undertake that no equipment will be used if it is uncalibrated or out of calibration.',
      '4. I confirm that all accessories, manuals, and related documentation are present and accounted for.',
      '5. I acknowledge my responsibility for the proper care, maintenance, and security of all equipment.',
      '6. I agree to report any damage, malfunction, or loss of any equipment immediately to the appropriate authorities.',
      '7. I understand that any misuse or negligence may result in disciplinary action.',
      '8. I acknowledge that this undertaking covers all equipment currently under project custody as listed above.'
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
    
    // Project In-charge and Asset Controller signatures
    doc.text('Project In-charge Signature:', margin, yPosition);
    doc.text('Asset Controller Signature:', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10; // Reduced from 15
    
    doc.text('_________________________', margin, yPosition);
    doc.text('_________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10; // Reduced from 15
    
    // Left (project in-charge) name removed; keep right side
    doc.text('Name: _________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10; // Reduced from 15
    
    // Left (project in-charge) date removed; keep right side
    doc.text('Date: _________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 12; // Reduced from 20

    // Add project information
    doc.setFontSize(9); // Reduced from 10
    doc.setFont('helvetica', 'normal');
    doc.text(`Project Name: ${project.projectname}`, margin, yPosition);
    doc.text(`WBS Code: ${project.wbs || 'N/A'}`, margin, yPosition + 6); // Reduced from 8
    yPosition += 12; // Reduced from 20

    // Add footer
    doc.setFontSize(9); // Reduced from 10
    doc.setFont('helvetica', 'normal');
    const footerText1 = 'This consolidated undertaking letter serves as a formal acknowledgment of project equipment custody and responsibility for all listed equipment.';
    const footerText2 = 'Please retain a copy for your records.';
    
    doc.text(footerText1, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6; // Reduced from 8
    doc.text(footerText2, pageWidth / 2, yPosition, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `Consolidated_Project_Undertaking_Letter_${project.projectname.replace(/\s+/g, '_')}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error in undertaking letter project API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}