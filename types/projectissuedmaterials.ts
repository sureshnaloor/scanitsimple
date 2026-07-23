export interface ProjectIssuedMaterialData {
  _id?: string;
  materialid: string; // 10-digit generated from ObjectId
  materialCode: string;
  materialDescription: string;
  uom: string; // Unit of Measure
  quantity: number;
  pendingRequests: number; // Sum of all requested but not yet issued quantities
  sourceProject: string;
  sourceWBS: string; // Source WBS
  sourcePONumber: string;
  sourceIssueNumber: string;
  sourceUnitRate: number;
  gatepassNumber?: string; // Gatepass number
  receivedByEmpNumber?: string; // Employee number of person receiving
  receivedByEmpName?: string; // Employee name of person receiving
  testDocs: string[]; // Array of file URLs
  remarks?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectIssuedMaterialIssue {
  _id?: string;
  materialid: string;
  issuedQuantity: number;
  issuedTo: string; // Employee name or department
  issuedBy: string; // Warehouse supervisor
  issueDate: Date;
  projectName?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface ProjectIssuedMaterialTransaction {
  _id?: string;
  materialid: string;
  transactionType: 'issue' | 'return' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference?: string; // Issue ID, return ID, or adjustment reason
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface MaterialRequest {
  _id?: string;
  materialid: string;
  drawingNumber: string;
  equipment: string;
  room: string;
  requestorName: string;
  qtyRequested: number;
  remarks?: string;
  status: 'pending' | 'approved' | 'rejected' | 'issued';
  requestDate: Date;
  createdBy?: string;
  createdAt?: Date;
}

export interface MaterialIssue {
  _id?: string;
  materialid: string;
  drawingNumber: string;
  equipment: string;
  room: string;
  requestorName: string;
  qtyRequested: number;
  issuerName: string;
  issueQuantity: number;
  remarks?: string;
  issueDate: Date;
  requestId?: string; // Reference to the original request if issued from a request
  createdBy?: string;
  createdAt?: Date;
}
