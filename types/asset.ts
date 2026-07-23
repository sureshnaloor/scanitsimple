export interface AssetData {
  _id?: string;
  assetnumber: string;
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
  assetdescription?: string;
  acquireddate?: Date;
  acquiredvalue?: number;
  assetnotes?: string;
  assetmodel?: string;
  assetmanufacturer?: string;
  assetserialnumber?: string;
  accessories?: string;
  legacyassetnumber?: string;
  anyotheridentifier?: string;
  
}

export interface Custodian {
  location: "warehouse" | "in use";
  projectName?: string;
  projectLocation?: string;
  department?: string;
  employeeNumber?: string;
  name: string;
  custodyFrom: string;
  // Add more fields as needed
}

export interface AssetCategory {
  category: string;
  subcategories: string[];
}

export interface AssetStatus {
  status: string;
  description: string;
}

export interface AssetLocation {
  location: string;
  description: string;
}

export interface AssetCategory {
  category: string;
  subcategories: string[];
}

export interface AssetModel {
  model: string;
  manufacturer: string;
}

export interface AssetAccessory {
  accessory: string;
  description: string;
}

export interface Calibration {
  _id?: string;
  assetnumber: string;
  calibrationRequired?: 'Required' | 'Not Required';
  /** @deprecated Prefer idlePeriodFrom / idlePeriodTo */
  idleCalibrationDuration?: string;
  /** Optional idle window when calibration is Required — equipment not expected to be calibrated during this range */
  idlePeriodFrom?: Date | string | null;
  idlePeriodTo?: Date | string | null;
  calibratedby: string;
  calibrationdate: Date | null;
  calibrationtodate: Date | null;
  calibrationpo?: string;
  calibfile?: string;
  calibcertificate?: string;
  createdby: string;
  createdat: Date;
}

export interface UnidentifiedItem {
  _id?: string;
  // Mandatory fields
  assetmodel: string;
  assetmanufacturer: string;
  assetserialnumber: string;
  assetdescription?: string;
  // Optional fields
  possibleassetnumber?: string;
  assetvalue?: number;
  assettype?: string;
  assetcategory?: string;
  assetsubcategory?: string;
  // Location and custody
  location?: string;
  locationdate?: Date;
  custodianuser?: string;
  custodianname?: string;
  // Metadata
  createdat?: Date;
  createdby?: string;
  updatedat?: Date;
  updatedby?: string;
}








