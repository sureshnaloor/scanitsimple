import TransportMaintenanceTypesMaster from '@/app/components/transport/TransportMaintenanceTypesMaster';

export default function TransportPreventiveMasterPage() {
  return (
    <TransportMaintenanceTypesMaster
      apiPath="/api/transportassets/maintenance-types/preventive"
      title="Preventive maintenance types"
      description="Master list for scheduled / preventive work (oil change, tires, etc.). Used when logging maintenance on transport assets."
      placeholder="e.g. Oil change"
    />
  );
}
