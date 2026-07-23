/** Response shape for GET /api/dashboard/overview */

export interface DashboardAssetStatusSlice {
  name: string;
  value: number;
}

export interface DashboardTypeSlice {
  label: string;
  value: number;
}

export interface DashboardCustodyRow {
  assetnumber: string;
  employeename?: string;
  employeenumber?: string;
  locationType?: string;
  location?: string;
  custodyfrom: string | null;
}

export interface DashboardCalibrationRow {
  assetnumber: string;
  calibrationtodate: string | null;
  assetdescription?: string;
  calibratedby?: string;
}

export interface DashboardPpeRow {
  _id: string;
  userEmpName: string;
  userEmpNumber: string;
  ppeName: string;
  quantityIssued: number;
  dateOfIssue: string | null;
  issuedByName?: string;
}

export interface DashboardProjectReturnRow {
  materialid: string;
  materialCode: string;
  materialDescription: string;
  quantity: number;
  uom: string;
  sourceProject?: string;
  createdAt: string | null;
}

export interface DashboardOverviewResponse {
  success: true;
  summary: {
    totalAssets: number;
    mmeCount: number;
    fixedAssetCount: number;
    assetsInCustody: number;
    custodyPercent: number;
    assetsAddedThisMonth: number;
    calibrationsDueSoon: number;
    expiredCalibrations: number;
  };
  assetStatus: DashboardAssetStatusSlice[];
  assetTypeDistribution: DashboardTypeSlice[];
  recentCustody: DashboardCustodyRow[];
  upcomingCalibrations: DashboardCalibrationRow[];
  recentPpe: DashboardPpeRow[];
  recentProjectReturns: DashboardProjectReturnRow[];
}

export interface DashboardCollectionMetaResponse {
  collection: string;
  documentCount: number;
  inferredFields: string[];
  recentDocuments: Record<string, unknown>[];
}
