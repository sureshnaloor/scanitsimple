export interface ProjectReturnMaterialData {
  _id?: string;
  materialid: string; // 10-digit generated from ObjectId
  materialCode: string;
  materialDescription: string;
  uom: string; // Unit of Measure
  quantity: number;
  pendingRequests: number; // Sum of all requested but not yet issued quantities
  sourceProject: string;
  sourcePONumber: string;
  sourceIssueNumber: string;
  sourceUnitRate: number;
  warehouseLocation: string; // Warehouse location
  yardRoomRackBin: string; // Yard/Room/Rack-Bin
  receivedInWarehouseDate?: Date; // Date when material was received in warehouse
  consignmentNoteNumber?: string; // Consignment note number
  testDocs: string[]; // Array of file URLs
  remarks?: string;
  disposed?: boolean; // Flag to mark if material is disposed
  disposedAt?: Date; // Date when material was disposed
  disposedBy?: string; // User who disposed the material
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectReturnMaterialTransaction {
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

export interface ProjReturnMaterialRequest {
  _id?: string;
  materialid: string;
  projectName: string;
  requestor: string;
  qtyRequested: number;
  remarks?: string;
  status: 'pending' | 'approved' | 'rejected' | 'issued';
  requestDate: Date;
  createdBy?: string;
  createdAt?: Date;
}

export interface ProjReturnMaterialIssue {
  _id?: string;
  materialid: string;
  projectName: string;
  budgetedWBS?: string;
  requestor?: string;
  requestorEmpNumber?: string;
  requestorName?: string;
  qtyRequested: number;
  issuerName: string;
  issueQuantity: number;
  remarks?: string;
  issueDate: Date;
  requestId?: string; // Reference to the original request if issued from a request
  createdBy?: string;
  createdAt?: Date;
}

export interface DisposedMaterial {
  _id?: string;
  originalMaterialId: string; // Reference to original material ID
  materialid: string; // 10-digit material ID
  materialCode: string;
  materialDescription: string;
  uom: string; // Unit of Measure
  disposedQuantity: number; // Quantity at time of disposal
  disposedValue: number; // Total value at time of disposal
  sourceProject: string;
  sourceWBS: string;
  sourcePONumber: string;
  sourceIssueNumber: string;
  sourceUnitRate: number;
  warehouseLocation: string;
  yardRoomRackBin: string;
  receivedInWarehouseDate?: Date;
  consignmentNoteNumber?: string;
  gatepassNumber?: string;
  receivedByEmpNumber?: string;
  receivedByEmpName?: string;
  remarks?: string;
  disposedBy: string; // User who disposed the material
  disposedAt: Date; // Date when material was disposed
  status: 'scrap'; // Status of disposed material
  createdAt: Date;
  updatedAt: Date;
}

