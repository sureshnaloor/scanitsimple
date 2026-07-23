/** Stored on equipmentcustody; `department` is legacy only — treat as project site in UI */
export type CustodyLocationType = 'warehouse' | 'camp/office' | 'project_site' | 'department';

export interface Custody {
  _id?: string;
  assetnumber: string;
  employeenumber: string;
  employeename: string;
  locationType: CustodyLocationType;
  /** Generic / legacy display line */
  location?: string;
  /** Master city (warehouse or department list depending on type) */
  custodyCity?: string;
  /** Selected premises document id from Admin → Locations → Premises */
  premisesId?: string;
  /** Denormalized label for display */
  premisesLabel?: string;
  floorRoom?: string;
  occupant?: string;
  custodyRemark?: string;
  /** Warehouse custody detail */
  rackBinPallet?: string;
  shedRoomNumber?: string;
  /** Project site custody detail */
  custodianDetail?: string;
  containerNumberRack?: string;
  /** Legacy warehouse flow */
  warehouseLocation?: string;
  warehouseCity?: string;
  /** Legacy: was used as city for camp/department */
  departmentLocation?: string;
  campOfficeLocation?: string;
  project?: string;
  projectname?: string;
  documentnumber?: string;
  createdat: Date;
  createdby: string;
  custodyfrom: Date;
  custodyto?: Date | null;
}

export interface CustodyRecord extends Custody {
  _id: string;
  assetnumber: string;
  employeenumber: string;
  employeename: string;
  locationType: CustodyLocationType;
  location: string;
}

export interface Employee {
  _id: string;
  empno: string;
  empname: string;
}

export interface Project {
  _id: string;
  wbs: string;
  projectname: string;
  projectManagerEmpNo?: string;
  projectManagerName?: string;
  department?: string;
  locationCity?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}
