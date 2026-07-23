import TransportMaintenanceTypesMaster from '@/app/components/transport/TransportMaintenanceTypesMaster';

export default function TransportBreakdownMasterPage() {
  return (
    <TransportMaintenanceTypesMaster
      apiPath="/api/transportassets/maintenance-types/breakdown"
      title="Breakdown maintenance types"
      description="Master list for repairs and damage (engine, body, etc.). Used when logging breakdown maintenance on transport assets."
      placeholder="e.g. Engine repair"
    />
  );
}
