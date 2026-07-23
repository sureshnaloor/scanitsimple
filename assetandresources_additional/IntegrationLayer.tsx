import React from 'react';

export interface IntegrationLayerProps {
  children: React.ReactNode;
}

// Lightweight placeholder integration layer – no external stores or context.
export const IntegrationLayer: React.FC<IntegrationLayerProps> = ({ children }) => {
  return <>{children}</>;
};

// Simple hook returning static integration data so any imports still type-check.
export const useIntegration = () => ({
  totalAssets: 0,
  totalResources: 0,
  equipmentResources: 0,
  manpowerResources: 0,
  syncedAssets: 0,
  isLoading: false,
  syncStatus: 'idle' as const,
});