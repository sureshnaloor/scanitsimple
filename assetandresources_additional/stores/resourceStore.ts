import { useState } from 'react';
import type { Asset } from './assetStore';

export interface Resource {
  id: string;
  name: string;
  type: 'equipment' | 'manpower';
  source?: 'asset' | 'manual';
}

const initialResources: Resource[] = [
  {
    id: 'R-2001',
    name: 'Field Technician Team',
    type: 'manpower',
    source: 'manual'
  },
  {
    id: 'R-2002',
    name: 'Calibration Bench',
    type: 'equipment',
    source: 'manual'
  }
];

export function useResourceStore() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [loading] = useState(false);

  const syncAssetsToResources = (assets: Asset[]) => {
    setResources(prev => {
      const assetResources: Resource[] = assets.map(asset => ({
        id: `AR-${asset.id}`,
        name: asset.name,
        type: 'equipment',
        source: 'asset'
      }));

      // Keep any non-asset resources and replace asset-sourced ones
      const manualOnly = prev.filter(r => r.source !== 'asset');
      return [...manualOnly, ...assetResources];
    });
  };

  return {
    resources,
    loading,
    syncAssetsToResources
  };
}



