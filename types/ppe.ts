// PPE Master Data Types
export interface PPEMaster {
  _id?: string;
  ppeId: string;
  ppeName: string;
  materialCode: string;
  life: number;
  lifeUOM: 'week' | 'month' | 'year';
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

// Database version without _id for insertions
export interface PPEMasterInsert {
  ppeId: string;
  ppeName: string;
  materialCode: string;
  life: number;
  lifeUOM: 'week' | 'month' | 'year';
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

// PPE Issue Record Types
export interface PPEIssueRecord {
  _id?: string;
  userEmpNumber: string;
  userEmpName: string;
  dateOfIssue: Date;
  ppeId: string;
  ppeName: string; // Denormalized for easier queries
  quantityIssued: number;
  isFirstIssue: boolean; // Y/N flag
  lastIssueDate?: Date; // Only if not first issue
  issueAgainstDue: boolean; // Y for due, N for damage
  remarks?: string;
  reservationNumber?: string; // Reservation number
  fileReferenceNumber?: string; // File reference number
  size?: string; // Size of the PPE item
  issuedBy: string; // Employee number of person who issued
  issuedByName: string; // Name of person who issued
  createdAt: Date;
  createdBy: string;
}

// Database version without _id for insertions
export interface PPEIssueRecordInsert {
  userEmpNumber: string;
  userEmpName: string;
  dateOfIssue: Date;
  ppeId: string;
  ppeName: string; // Denormalized for easier queries
  quantityIssued: number;
  isFirstIssue: boolean; // Y/N flag
  lastIssueDate?: Date; // Only if not first issue
  issueAgainstDue: boolean; // Y for due, N for damage
  remarks?: string;
  reservationNumber?: string; // Reservation number
  fileReferenceNumber?: string; // File reference number
  size?: string; // Size of the PPE item
  issuedBy: string; // Employee number of person who issued
  issuedByName: string; // Name of person who issued
  createdAt: Date;
  createdBy: string;
}

// Bulk PPE Issue Types
export interface PPEBulkIssue {
  _id?: string;
  departmentOrProjectName: string;
  location: string;
  ppeId: string;
  ppeName: string; // Denormalized for easier queries
  quantityIssued: number;
  receiverUserEmpNumber: string;
  receiverUserEmpName: string; // Denormalized for easier queries
  issueDate: Date;
  issuedBy: string; // Employee number of person who issued
  issuedByName: string; // Name of person who issued
  remarks?: string;
  createdAt: Date;
  createdBy: string;
}

// PPE Receipt Record
export interface PPEReceipt {
  _id?: string;
  ppeId: string;
  ppeName: string; // Denormalized for easier queries
  dateOfReceipt: Date;
  quantityReceived: number;
  remarks?: string;
  receivedBy: string; // Employee number of person who received
  receivedByName: string; // Name of person who received
  createdAt: Date;
  createdBy: string;
}

// Database version without _id for insertions
export interface PPEReceiptInsert {
  ppeId: string;
  ppeName: string;
  dateOfReceipt: Date;
  quantityReceived: number;
  remarks?: string;
  receivedBy: string;
  receivedByName: string;
  createdAt: Date;
  createdBy: string;
}

// Database version without _id for insertions
export interface PPEBulkIssueInsert {
  departmentOrProjectName: string;
  location: string;
  ppeId: string;
  ppeName: string; // Denormalized for easier queries
  quantityIssued: number;
  receiverUserEmpNumber: string;
  receiverUserEmpName: string; // Denormalized for easier queries
  issueDate: Date;
  issuedBy: string; // Employee number of person who issued
  issuedByName: string; // Name of person who issued
  remarks?: string;
  createdAt: Date;
  createdBy: string;
}

// Employee Types (Updated with active field)
export interface Employee {
  _id?: string;
  empno: string;
  empname: string;
  active?: 'Y' | 'N' | null; // Default null or Y, N if resigned/exited
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

// Database version without _id for insertions
export interface EmployeeInsert {
  empno: string;
  empname: string;
  active?: 'Y' | 'N' | null; // Default null or Y, N if resigned/exited
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

// PPE Transaction Types
export interface PPETransaction {
  _id?: string;
  ppeId: string;
  initialQty?: number; // Only for initial stock entry
  dateInitialQty?: Date; // Only for initial stock entry
  dateTransaction: Date;
  relatedRecordId?: string; // _id of ppe-records or ppe-bulk-issues
  relatedRecordType?: 'issue' | 'bulk' | 'receipt'; // Type of related record
  qtyIssued?: number; // Quantity issued (negative for issues)
  qtyAfterIssue: number; // Current stock after this transaction
  transactionType: 'initial' | 'issue' | 'bulk_issue' | 'receipt'; // Type of transaction
  remarks?: string;
  createdBy: string;
  createdAt: Date;
}

// Database version without _id for insertions
export interface PPETransactionInsert {
  ppeId: string;
  initialQty?: number;
  dateInitialQty?: Date;
  dateTransaction: Date;
  relatedRecordId?: string;
  relatedRecordType?: 'issue' | 'bulk' | 'receipt';
  qtyIssued?: number;
  qtyAfterIssue: number;
  transactionType: 'initial' | 'issue' | 'bulk_issue' | 'receipt';
  remarks?: string;
  createdBy: string;
  createdAt: Date;
}

// PPE Stock Balance Types (New collection for accurate stock tracking)
export interface PPEStockBalance {
  _id?: string;
  ppeId: string;
  balQty: number; // Current balance quantity
  dateTimeUpdated: Date; // Date and time of last update
  transactionId: string; // ID of the transaction that caused this update
  createdAt: Date;
  updatedAt: Date;
}

// Database version without _id for insertions
export interface PPEStockBalanceInsert {
  ppeId: string;
  balQty: number;
  dateTimeUpdated: Date;
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// PPE Stock Summary Types
export interface PPEStockSummary {
  ppeId: string;
  ppeName: string;
  currentStock: number;
  initialStock: number;
  totalIssued: number;
  lastTransactionDate: Date;
  lastIssueDate?: Date;
}

// PPE Issue Summary Types
export interface PPEIssueSummary {
  ppeId: string;
  ppeName: string;
  totalIssued: number;
  totalUsers: number;
  lastIssueDate: Date;
  nextDueDate?: Date;
}

// PPE Due for Reissue Types
export interface PPEDueForReissue {
  _id: string;
  userEmpNumber: string;
  userEmpName: string;
  ppeId: string;
  ppeName: string;
  lastIssueDate: Date;
  dueDate: Date;
  daysOverdue: number;
  quantity: number;
}

// API Response Types
export interface PPEApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PPEPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
