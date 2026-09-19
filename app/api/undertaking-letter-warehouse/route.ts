import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { connectToDatabase } from '@/lib/mongodb';
import { assetHeaderLookupStages } from '@/lib/assetHeaderLookup';
import { openWarehouseMatch, WAREHOUSE_REPORT_CITIES } from '@/lib/openCustodyMatch';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const city = (request.nextUrl.searchParams.get('city') || '').trim();
    const allowed = WAREHOUSE_REPORT_CITIES.some((c) => c.toLowerCase() === city.toLowerCase());
    if (!allowed) {
      return NextResponse.json(
        { error: 'city must be Dammam or Jubail' },
        { status: 400 }
      );
    }
    const cityLabel = WAREHOUSE_REPORT_CITIES.find((c) => c.toLowerCase() === city.toLowerCase()) || city;

    const { db } = await connectToDatabase();
    const equipmentData = await db
      .collection('equipmentcustody')
      .aggregate([
        { $match: openWarehouseMatch(cityLabel) },
        ...assetHeaderLookupStages(),
        {
          $project: {
            assetnumber: { $ifNull: ['$assetDetails.assetnumber', '$assetnumber'] },
            assetdescription: '$assetDetails.assetdescription',
            assetstatus: '$assetDetails.assetstatus',
            assetmodel: '$assetDetails.assetmodel',
            assetmanufacturer: '$assetDetails.assetmanufacturer',
            assetserialnumber: '$assetDetails.assetserialnumber',
            custodyfrom: 1,
            warehouseCity: {
              $ifNull: [
                { $cond: [{ $gt: ['$warehouseCity', ''] }, '$warehouseCity', null] },
                '$custodyCity',
              ],
            },
          },
        },
        { $sort: { assetnumber: 1 } },
      ])
      .toArray();

    if (!equipmentData.length) {
      return NextResponse.json({ error: `No equipment found for ${cityLabel} warehouse` }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSOLIDATED WAREHOUSE EQUIPMENT CUSTODY UNDERTAKING LETTER', pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += 12;

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${currentDate}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('WAREHOUSE INFORMATION', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Warehouse: ${cityLabel}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Items: ${equipmentData.length}`, margin, yPosition);
    yPosition += 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPMENT UNDER WAREHOUSE CUSTODY', margin, yPosition);
    yPosition += 8;

    const tableHeaders = ['Asset Number', 'Description', 'Model', 'Manufacturer', 'Status', 'Custody From'];
    const colWidths = [25, 45, 30, 35, 20, 25];
    const startX = margin;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let xPosition = startX;
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 5;
    doc.line(startX, yPosition - 2, startX + colWidths.reduce((a, b) => a + b, 0), yPosition - 2);
    yPosition += 3;

    doc.setFont('helvetica', 'normal');
    const lineHeight = 5;
    equipmentData.forEach((item) => {
      const rowData = [
        item.assetnumber || 'N/A',
        item.assetdescription || 'N/A',
        item.assetmodel || 'N/A',
        item.assetmanufacturer || 'N/A',
        item.assetstatus || 'N/A',
        item.custodyfrom ? new Date(item.custodyfrom).toLocaleDateString() : 'N/A',
      ];
      const wrappedPerCol: Array<string[] | string> = rowData.map((data, colIndex) =>
        doc.splitTextToSize(String(data), colWidths[colIndex] - 2)
      );
      const maxLines = wrappedPerCol.reduce((max, lines) => {
        const count = Array.isArray(lines) ? lines.length : 1;
        return Math.max(max, count);
      }, 1);
      const rowHeight = maxLines * lineHeight + 2;

      if (yPosition + rowHeight > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      xPosition = startX;
      wrappedPerCol.forEach((lines, colIndex) => {
        doc.text(lines as string[] | string, xPosition + 1, yPosition);
        xPosition += colWidths[colIndex];
      });
      yPosition += rowHeight;
    });

    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('UNDERTAKING', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const introText = `I, warehouse in-charge of the ${cityLabel} warehouse, hereby acknowledge and undertake the following regarding all equipment listed above:`;
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, yPosition);
    yPosition += introLines.length * 4 + 6;

    const undertakingPoints = [
      '1. I confirm that all the above-mentioned equipment is currently stored in this warehouse.',
      '2. I verify that all equipment is in good working condition and all accessories are available.',
      '3. I undertake that no equipment will be issued or used if it is uncalibrated or out of calibration.',
      '4. I confirm that all accessories, manuals, and related documentation are present and accounted for.',
      '5. I acknowledge my responsibility for the proper care, maintenance, and security of all equipment.',
      '6. I agree to report any damage, malfunction, or loss of any equipment immediately to the appropriate authorities.',
      '7. I understand that any misuse or negligence may result in disciplinary action.',
      '8. I acknowledge that this undertaking covers all equipment currently in this warehouse as listed above.',
    ];

    undertakingPoints.forEach((point) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      const lines = doc.splitTextToSize(point, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4 + 3;
    });

    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', margin, yPosition);
    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Warehouse In-charge Signature:', margin, yPosition);
    doc.text('Asset Controller Signature:', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10;
    doc.text('_________________________', margin, yPosition);
    doc.text('_________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10;
    doc.text('Name: _________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10;
    doc.text('Date: _________________________', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Warehouse: ${cityLabel}`, margin, yPosition);
    doc.text(`Items: ${equipmentData.length}`, margin, yPosition + 6);
    yPosition += 12;

    doc.text(
      'This consolidated undertaking letter serves as a formal acknowledgment of warehouse equipment custody and responsibility for all listed equipment.',
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 10;
    doc.text('Please retain a copy for your records.', pageWidth / 2, yPosition, { align: 'center' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `Consolidated_Warehouse_Undertaking_Letter_${cityLabel}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating warehouse undertaking letter:', error);
    return NextResponse.json({ error: 'Failed to generate warehouse undertaking letter' }, { status: 500 });
  }
}
