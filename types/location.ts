export interface LocationLog {
  _id?: string;
  assetNumber: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  landmark?: string;
  address?: string;
}