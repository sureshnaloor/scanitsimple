// Types for Materials inventory feature

export interface Material {
  _id?: string;
  code: string; // max 12 chars (SAP style)
  description: string; // max 40 chars
  baseUOM: string;
  orderUOM: string;
  skuUOM: string;
  longText: string; // max 400 chars
  materialType: string;
  materialGroup: string;
  mrpRelevant: boolean;
  specialStock: boolean;
  remarks?: string;
  status: 'stock' | 'inventory';
}

export interface MaterialTransaction {
  _id?: string;
  materialId: string; // reference to Material _id
  costElement: string;
  poNumber: string;
  poLineItem: string;
  receivedQuantity: number;
  batchNumber: string; // unique batch identifier
  isIssueReceipt?: boolean; // true if created from a parent batch issue
  parentBatchId?: string; // parent batch ID link
  storageLocationId?: string; // consolidated storage details
  rackNumber?: string;
  binNumber?: string;
  roomNumber?: string;
  palletNumber?: string;
  yardNumber?: string;
  remarks?: string;
  createdAt: Date;
}

export interface StorageLocation {
  _id?: string;
  name: string; // e.g. Central Warehouse, Site Warehouse
  incharge: string; // person incharge
  remarks?: string;
  createdAt: Date;
}

export interface MaterialBatch {
  _id?: string;
  materialId: string;
  transactionId: string; // reference to MaterialTransaction
  initialQuantity?: number;
  currentQuantity?: number;
  parentBatchId?: string; // parent batch ID link
  storageLocationId?: string; // consolidated storage details
  rackNumber?: string;
  binNumber?: string;
  roomNumber?: string;
  palletNumber?: string;
  yardNumber?: string;
  remarks?: string;
  createdAt: Date;
}
