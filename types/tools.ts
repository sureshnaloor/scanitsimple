export interface ToolData {
  _id?: string;
  assetnumber: string; // 10-digit generated from ObjectId
  serialNumber?: string;
  manufacturer?: string;
  modelNumber?: string;
  toolDescription: string;
  toolCost?: number;
  purchasedDate?: Date;
  purchasePONumber?: string;
  purchaseSupplier?: string;
  toolCategory?: string;
  toolSubcategory?: string;
  toolStatus?: string;
  toolLocation?: string;
  toolCondition?: string;
  toolNotes?: string;
  accessories?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ToolCustody {
  _id?: string;
  assetnumber: string;
  location: "warehouse" | "in use";
  projectName?: string;
  projectLocation?: string;
  department?: string;
  employeeNumber?: string;
  name: string;
  custodyFrom: string;
  custodyTo?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface ToolCategory {
  category: string;
  subcategories: string[];
}

export interface ToolStatus {
  status: string;
  description: string;
}

export interface ToolLocation {
  location: string;
  description: string;
}

export interface ToolCondition {
  condition: string;
  description: string;
}
