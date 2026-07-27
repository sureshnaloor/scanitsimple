// app/api/material-documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const SETTINGS_COLLECTION = 'companysettings';

// Helper: Query company details from the new companysettings collection
async function fetchCompanyDetails(db: any) {
  try {
    const settings = await db.collection(SETTINGS_COLLECTION).findOne({});
    if (settings) {
      return {
        name: settings.name || 'GCC LABS COMPANY',
        address: settings.address || 'Dammam',
        city: settings.city || 'Dammam',
        country: settings.country || 'Saudi Arabia',
        logo: settings.logo || '' // Base64 string
      };
    }
  } catch (err) {
    console.error('Error querying company settings:', err);
  }
  
  return {
    name: 'GCC LABS COMPANY',
    address: 'Dammam',
    city: 'Dammam',
    country: 'Saudi Arabia',
    logo: ''
  };
}

// Helper: Query employee details from the database
async function getEmployeeDetails(db: any, rawValue: string) {
  if (!rawValue) {
    return { empno: '—', empname: '—', designation: '—', department: '—' };
  }
  
  const parts = String(rawValue).split(' - ');
  const empno = parts[0].trim();
  
  try {
    let emp = await db.collection('employees').findOne({ empno: empno });
    if (!emp && parts.length > 1) {
      emp = await db.collection('employees').findOne({ empname: { $regex: parts[1].trim(), $options: 'i' } });
    }
    if (!emp) {
      emp = await db.collection('employees').findOne({
        $or: [
          { empno: rawValue.trim() },
          { empname: { $regex: rawValue.trim(), $options: 'i' } }
        ]
      });
    }
    
    if (emp) {
      return {
        empno: emp.empno,
        empname: emp.empname,
        designation: emp.designation || 'Staff / Worker',
        department: emp.department || 'Operations'
      };
    }
  } catch (err) {
    console.error('Error searching employee:', err);
  }
  
  return {
    empno: empno,
    empname: parts[1] || rawValue,
    designation: '—',
    department: '—'
  };
}

// Helper: Recursively find original PO transaction by traversing up the parent batches
async function getRootPOTransaction(db: any, batchId: string) {
  try {
    let currentBatch = await db.collection('materialbatches').findOne({ _id: new ObjectId(batchId) });
    while (currentBatch && currentBatch.parentBatchId) {
      currentBatch = await db.collection('materialbatches').findOne({ _id: new ObjectId(currentBatch.parentBatchId) });
    }
    if (currentBatch) {
      return await db.collection('materialtransactions').findOne({ _id: new ObjectId(currentBatch.transactionId) });
    }
  } catch (err) {
    console.error('Error tracing root PO transaction:', err);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const docType = searchParams.get('docType'); // 'grn', 'gi', 'gp'

    if (!id || !docType) {
      return apiJson({ error: 'id and docType parameters are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const company = await fetchCompanyDetails(db);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Drawing helper functions
    const drawPageHeader = (docInstance: jsPDF, yStart: number, docTitle: string) => {
      let textOffset = margin;
      
      // Draw company logo if base64 data exists
      if (company.logo) {
        try {
          docInstance.addImage(company.logo, 'PNG', margin, yStart, 28, 12);
          textOffset = margin + 33; // Offset company details to the right of the logo
        } catch (err) {
          console.error('Error rendering company logo in PDF:', err);
        }
      }

      // Company Name
      docInstance.setFontSize(16);
      docInstance.setFont('helvetica', 'bold');
      docInstance.setTextColor(26, 54, 93); // Dark Blue
      docInstance.text(company.name.toUpperCase(), textOffset, yStart + 4);
      
      // Company Address
      docInstance.setFontSize(8.5);
      docInstance.setFont('helvetica', 'normal');
      docInstance.setTextColor(110, 120, 130);
      const companyAddress = `${company.address}, ${company.city}, ${company.country}`.toUpperCase();
      docInstance.text(companyAddress, textOffset, yStart + 9);
      
      // Document Title Header on the right
      docInstance.setFontSize(12.5);
      docInstance.setFont('helvetica', 'bold');
      docInstance.setTextColor(40, 40, 40);
      docInstance.text(docTitle, pageWidth - margin, yStart + 6, { align: 'right' });

      // Line separator
      docInstance.setDrawColor(210, 215, 220);
      docInstance.setLineWidth(0.5);
      docInstance.line(margin, yStart + 14, pageWidth - margin, yStart + 14);
      
      return yStart + 22;
    };

    const drawGrid = (docInstance: jsPDF, yStart: number, items: { label: string; value: string }[]) => {
      docInstance.setFontSize(9);
      docInstance.setTextColor(80, 80, 80);
      const colWidth = contentWidth / 2;
      let curY = yStart;
      
      items.forEach((item, index) => {
        const isRightCol = index % 2 === 1;
        const xPos = margin + (isRightCol ? colWidth : 0);
        
        docInstance.setFont('helvetica', 'bold');
        docInstance.setTextColor(60, 60, 60);
        docInstance.text(`${item.label}:`, xPos, curY);
        
        docInstance.setFont('helvetica', 'normal');
        docInstance.setTextColor(90, 90, 90);
        
        // Shorten or clip display inside half columns to prevent overlapping
        const textVal = String(item.value || '—');
        const maxLen = 38;
        const displayVal = textVal.length > maxLen ? textVal.substring(0, maxLen) + '...' : textVal;
        
        docInstance.text(displayVal, xPos + 40, curY);
        
        if (isRightCol) {
          curY += 7;
        }
      });
      
      return curY + (items.length % 2 === 1 ? 7 : 0) + 4;
    };

    const drawFullWidthRow = (docInstance: jsPDF, yStart: number, label: string, value: string) => {
      docInstance.setFontSize(9);
      docInstance.setFont('helvetica', 'bold');
      docInstance.setTextColor(60, 60, 60);
      docInstance.text(`${label}:`, margin, yStart);
      
      docInstance.setFont('helvetica', 'normal');
      docInstance.setTextColor(90, 90, 90);
      const lines = docInstance.splitTextToSize(String(value || '—'), contentWidth - 40);
      docInstance.text(lines, margin + 40, yStart);
      
      return yStart + Math.max(7, lines.length * 5.5) + 2;
    };

    const drawMaterialTable = (docInstance: jsPDF, yStart: number, code: string, desc: string, uom: string, qty: string) => {
      docInstance.setFontSize(9);
      docInstance.setFont('helvetica', 'bold');
      docInstance.setTextColor(40, 40, 40);
      docInstance.setFillColor(243, 244, 246);
      docInstance.rect(margin, yStart, contentWidth, 8, 'F');
      
      docInstance.text('Material Code', margin + 3, yStart + 5.5);
      docInstance.text('Description', margin + 45, yStart + 5.5);
      docInstance.text('UOM', margin + 140, yStart + 5.5);
      docInstance.text('Quantity', margin + 160, yStart + 5.5);

      docInstance.setFont('helvetica', 'normal');
      docInstance.setTextColor(70, 70, 70);
      const nextY = yStart + 8;
      
      docInstance.text(code, margin + 3, nextY + 6);
      const lines = docInstance.splitTextToSize(desc, 90);
      docInstance.text(lines, margin + 45, nextY + 6);
      docInstance.text(uom, margin + 140, nextY + 6);
      docInstance.text(qty, margin + 160, nextY + 6);

      const tableHeight = Math.max(12, lines.length * 5.5 + 8);
      return nextY + tableHeight + 4;
    };

    const drawEmployeeSection = (docInstance: jsPDF, yStart: number, title: string, emp: any) => {
      docInstance.setFontSize(9.5);
      docInstance.setFont('helvetica', 'bold');
      docInstance.setTextColor(26, 54, 93);
      docInstance.text(title.toUpperCase(), margin, yStart);
      docInstance.setDrawColor(230, 230, 230);
      docInstance.line(margin, yStart + 2, pageWidth - margin, yStart + 2);
      
      const details = [
        { label: 'Employee Number', value: emp.empno },
        { label: 'Employee Name', value: emp.empname },
        { label: 'Designation', value: emp.designation },
        { label: 'Department', value: emp.department }
      ];
      
      return drawGrid(docInstance, yStart + 8, details);
    };

    const drawSignatureBlock = (docInstance: jsPDF, yStart: number, sigs: string[]) => {
      const bottomY = Math.max(yStart, pageHeight - 48);
      docInstance.setFontSize(9);
      docInstance.setTextColor(50, 50, 50);

      const colCount = sigs.length;
      const colWidth = contentWidth / colCount;

      sigs.forEach((sig, index) => {
        const xPos = margin + (index * colWidth) + (colWidth / 2);
        
        docInstance.setDrawColor(180, 180, 180);
        docInstance.line(xPos - 25, bottomY, xPos + 25, bottomY);
        
        docInstance.setFont('helvetica', 'normal');
        docInstance.text(sig, xPos, bottomY + 5, { align: 'center' });
      });
    };

    // ----------------------------------------------------
    // GOODS RECEIPT NOTE (GRN) PDF
    // ----------------------------------------------------
    if (docType === 'grn') {
      const tx = await db.collection('materialtransactions').findOne({ _id: new ObjectId(id) });
      if (!tx) return apiJson({ error: 'Receipt transaction not found' }, { status: 404 });

      const material = await db.collection('materials').findOne({ _id: new ObjectId(tx.materialId) });
      const destWarehouse = tx.storageLocationId 
        ? await db.collection('storagelocations').findOne({ _id: new ObjectId(tx.storageLocationId) }) 
        : null;

      let sourceDetails = 'Direct PO Delivery';
      let parentBatchInfo = '';
      let sourceWarehouseName = '';

      if (tx.parentBatchId) {
        const parentBatch = await db.collection('materialbatches').findOne({ _id: new ObjectId(tx.parentBatchId) });
        if (parentBatch) {
          const parentTx = await db.collection('materialtransactions').findOne({ _id: new ObjectId(parentBatch.transactionId) });
          const sourceWarehouse = parentBatch.storageLocationId
            ? await db.collection('storagelocations').findOne({ _id: new ObjectId(parentBatch.storageLocationId) })
            : null;

          sourceWarehouseName = sourceWarehouse ? sourceWarehouse.name : 'Central/Other Store';
          sourceDetails = `Store Transfer from ${sourceWarehouseName}`;
          parentBatchInfo = parentTx ? parentTx.batchNumber : '';
        }
      }

      // Fetch root PO recursively
      const originBatchId = tx.parentBatchId || '';
      const rootTx = originBatchId ? await getRootPOTransaction(db, originBatchId) : null;
      const poNum = rootTx ? rootTx.poNumber : tx.poNumber;
      const poLine = rootTx ? rootTx.poLineItem : tx.poLineItem;
      const costEl = rootTx ? rootTx.costElement : tx.costElement;

      let y = 15;
      y = drawPageHeader(doc, y, 'GOODS RECEIPT NOTE (GRN)');

      // Grid only contains short metadata to prevent text overlaps
      const grnDetails = [
        { label: 'GRN Number', value: String(tx._id).substring(16).toUpperCase() },
        { label: 'Receipt Date', value: new Date(tx.createdAt).toLocaleString() },
        { label: 'Original PO Ref', value: `${poNum || '—'} / Item: ${poLine || '—'}` },
        { label: 'Cost Element', value: costEl || '—' }
      ];
      y = drawGrid(doc, y, grnDetails);

      // Display long strings on their own full-width lines
      y = drawFullWidthRow(doc, y, 'Source Origin', sourceDetails);
      y = drawFullWidthRow(doc, y, 'Unique Batch No.', tx.batchNumber);

      if (parentBatchInfo) {
        y = drawFullWidthRow(doc, y, 'Source Batch Ref', parentBatchInfo);
      }
      if (tx.remarks) {
        y = drawFullWidthRow(doc, y, 'Remarks / Ref', tx.remarks);
      }

      // Material details
      y = drawMaterialTable(
        doc,
        y,
        material ? material.code : '—',
        material ? material.description : '—',
        material ? material.baseUOM : '—',
        String(tx.receivedQuantity)
      );

      // Destination storage map details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 54, 93);
      doc.text('RECEIVING STORAGE MAP (DESTINATION)', margin, y);
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;

      // Draw long strings on full width rows
      y = drawFullWidthRow(doc, y, 'Receiving Store', destWarehouse ? destWarehouse.name : '—');
      y = drawFullWidthRow(doc, y, 'Store Incharge', destWarehouse ? destWarehouse.incharge : '—');

      const storageDetails = [
        { label: 'Rack Number', value: tx.rackNumber || '—' },
        { label: 'Bin Number', value: tx.binNumber || '—' },
        { label: 'Room / Pallet No.', value: `${tx.roomNumber || '—'} / ${tx.palletNumber || '—'}` },
        { label: 'Yard / Laydown', value: tx.yardNumber || '—' }
      ];
      y = drawGrid(doc, y, storageDetails);

      drawSignatureBlock(doc, y, ['Received By (Signature)', 'Warehouse Storekeeper', 'Operations Manager Approved']);

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Goods_Receipt_${tx.batchNumber}.pdf"`,
        }
      });
    }

    // ----------------------------------------------------
    // GOODS ISSUE (GI) AND GATE PASS (GP) PDF
    // ----------------------------------------------------
    if (docType === 'gi' || docType === 'gp') {
      const issue = await db.collection('materialbatchissues').findOne({ _id: new ObjectId(id) });
      if (!issue) return apiJson({ error: 'Issue log record not found' }, { status: 404 });

      const parentBatch = await db.collection('materialbatches').findOne({ _id: new ObjectId(issue.batchId) });
      const material = parentBatch ? await db.collection('materials').findOne({ _id: new ObjectId(parentBatch.materialId) }) : null;
      const parentTx = parentBatch ? await db.collection('materialtransactions').findOne({ _id: new ObjectId(parentBatch.transactionId) }) : null;
      const parentWarehouse = parentBatch?.storageLocationId
        ? await db.collection('storagelocations').findOne({ _id: new ObjectId(parentBatch.storageLocationId) })
        : null;

      // Query detailed employee cards from employees collection
      const issuerEmp = await getEmployeeDetails(db, issue.issuedBy);
      const receiverEmp = await getEmployeeDetails(db, issue.receivedBy);

      const hasDestWarehouse = Boolean(issue.destinationStorageLocationId);
      const destWarehouse = hasDestWarehouse
        ? await db.collection('storagelocations').findOne({ _id: new ObjectId(issue.destinationStorageLocationId) })
        : null;

      // Fetch root PO recursively
      const rootTx = await getRootPOTransaction(db, issue.batchId);
      const poNum = rootTx ? rootTx.poNumber : (parentTx ? parentTx.poNumber : '—');
      const poLine = rootTx ? rootTx.poLineItem : (parentTx ? parentTx.poLineItem : '—');
      const costEl = rootTx ? rootTx.costElement : (parentTx ? parentTx.costElement : '—');

      const originBatchInfo = parentTx ? parentTx.batchNumber : '—';

      // Render Page 1: Goods Issue Slip
      let y = 15;
      y = drawPageHeader(doc, y, hasDestWarehouse ? 'GOODS ISSUE SLIP (TRANSFER)' : 'GOODS ISSUE SLIP (DIRECT USE)');

      const issueDetails = [
        { label: 'Issue Ref Code', value: String(issue._id).substring(16).toUpperCase() },
        { label: 'Issue Date', value: new Date(issue.issueDate).toLocaleString() },
        { label: 'Origin Rack/Bin', value: `Rack: ${parentBatch?.rackNumber || '—'} / Bin: ${parentBatch?.binNumber || '—'}` },
        { label: 'Original PO Ref', value: `${poNum} / Item: ${poLine}` },
        { label: 'Cost Element', value: costEl },
        { label: 'Drawing Number', value: issue.drawingNumber || '—' },
        { label: 'Transport Mode', value: issue.transportMode || 'by hand' }
      ];
      y = drawGrid(doc, y, issueDetails);

      // Long text items in Goods Issue Page 1
      y = drawFullWidthRow(doc, y, 'Origin Store (Source)', parentWarehouse ? parentWarehouse.name : '—');
      y = drawFullWidthRow(doc, y, 'Original PO Batch Ref', originBatchInfo);
      if (issue.remarks) {
        y = drawFullWidthRow(doc, y, 'Remarks', issue.remarks);
      }

      if (hasDestWarehouse) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 54, 93);
        doc.text('TRANSFER DESTINATION TARGET', margin, y);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 8;

        y = drawFullWidthRow(doc, y, 'Destination Warehouse', destWarehouse ? destWarehouse.name : '—');
        y = drawFullWidthRow(doc, y, 'Dest Store Incharge', destWarehouse ? destWarehouse.incharge : '—');
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 54, 93);
        doc.text('DIRECT USE CONSUMPTION LOCATION', margin, y);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 8;

        y = drawFullWidthRow(doc, y, 'Project Equipment/Room', issue.usageLocation || '—');
      }

      // Material Row
      y = drawMaterialTable(
        doc,
        y,
        material ? material.code : '—',
        material ? material.description : '—',
        material ? material.baseUOM : '—',
        String(issue.quantity)
      );

      // Signatures and Employees
      y = drawEmployeeSection(doc, y, 'Issuing Storekeeper (Source)', issuerEmp);
      y = drawEmployeeSection(doc, y, 'Receiving Personnel (Target)', receiverEmp);

      drawSignatureBlock(doc, y, ['Storekeeper (Issued By)', 'Receiver (Signed)', 'Authorized Supervisor']);

      // ----------------------------------------------------
      // Render Page 2: Gate Pass / E-Pass (Only if store transfer)
      // ----------------------------------------------------
      if (hasDestWarehouse) {
        doc.addPage();
        let yPage2 = 15;
        yPage2 = drawPageHeader(doc, yPage2, 'MATERIAL TRANSFER GATE PASS (E-PASS)');

        const gatePassDetails = [
          { label: 'Gate Pass Number', value: `GP-${String(issue._id).substring(16).toUpperCase()}` },
          { label: 'Dispatch Date', value: new Date(issue.issueDate).toLocaleString() },
          { label: 'Mode of Transport', value: issue.transportMode || 'trailer' },
          { label: 'Drawing Reference', value: issue.drawingNumber || '—' },
          { label: 'Driver Employee No.', value: receiverEmp.empno },
          { label: 'Original PO Ref', value: `${poNum} / Item: ${poLine}` },
          { label: 'Cost Element', value: costEl }
        ];
        yPage2 = drawGrid(doc, yPage2, gatePassDetails);

        // Long text rows for page 2
        yPage2 = drawFullWidthRow(doc, yPage2, 'Transit Carrier / Driver', receiverEmp.empname);
        yPage2 = drawFullWidthRow(doc, yPage2, 'Original PO Batch Ref', originBatchInfo);
        if (issue.remarks) {
          yPage2 = drawFullWidthRow(doc, yPage2, 'Gate Pass Remarks', issue.remarks);
        }

        // Routing Section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 54, 93);
        doc.text('WAREHOUSE GATE-TO-GATE ROUTING', margin, yPage2);
        doc.line(margin, yPage2 + 2, pageWidth - margin, yPage2 + 2);
        yPage2 += 8;

        yPage2 = drawFullWidthRow(doc, yPage2, 'Source Warehouse (Origin)', parentWarehouse ? parentWarehouse.name : '—');
        yPage2 = drawFullWidthRow(doc, yPage2, 'Destination Warehouse (Target)', destWarehouse ? destWarehouse.name : '—');

        const routingDetails = [
          { label: 'Source Rack / Bin', value: `Rack: ${parentBatch?.rackNumber || '—'} / Bin: ${parentBatch?.binNumber || '—'}` },
          { label: 'Target Store Incharge', value: destWarehouse ? destWarehouse.incharge : '—' }
        ];
        yPage2 = drawGrid(doc, yPage2, routingDetails);

        // Material row Page 2
        yPage2 = drawMaterialTable(
          doc,
          yPage2,
          material ? material.code : '—',
          material ? material.description : '—',
          material ? material.baseUOM : '—',
          String(issue.quantity)
        );

        yPage2 += 4;

        // Security Stamp lines
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 54, 93);
        doc.text('SECURITY VERIFICATION & STAMP', margin, yPage2);
        doc.line(margin, yPage2 + 2, pageWidth - margin, yPage2 + 2);
        yPage2 += 8;

        const securityLogs = [
          { label: 'Gate-Out Verification', value: 'Pending Outbound Security Check' },
          { label: 'Gate-In Verification', value: 'Pending Destination Gate Verification' }
        ];
        yPage2 = drawGrid(doc, yPage2, securityLogs);

        drawSignatureBlock(doc, yPage2, ['Warehouse Dispatcher', 'Driver / Carrier Sign', 'Security Out-Gate Stamp', 'Security In-Gate Stamp']);
      }

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      const docName = hasDestWarehouse ? 'Issue_GatePass' : 'Goods_Issue';
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${docName}_${issue._id}.pdf"`,
        }
      });
    }

    return apiJson({ error: 'Invalid docType parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error generating PDF document:', error);
    return apiJson({ error: 'Error generating PDF document' }, { status: 500 });
  }
}
