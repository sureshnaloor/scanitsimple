import { useState } from 'react';

export interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string;
}

const initialAssets: Asset[] = [
  {
    id: 'A-1001',
    name: 'High Precision Caliper',
    category: 'Measuring Instruments',
    status: 'Active',
    location: 'Main Warehouse'
  },
  {
    id: 'A-1002',
    name: 'Server Rack',
    category: 'IT Assets',
    status: 'In Use',
    location: 'Data Center'
  }
];

export function useAssetStore() {
  const [assets] = useState<Asset[]>(initialAssets);
  const [loading] = useState(false);

  return {
    assets,
    loading
  };
}



