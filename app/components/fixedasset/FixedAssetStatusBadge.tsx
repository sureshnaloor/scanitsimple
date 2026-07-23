import { statusBadgeClass } from '@/lib/fixedAssetPageDesign';

type Props = {
  status: string;
};

export default function FixedAssetStatusBadge({ status }: Props) {
  if (!status) return <span className="text-[#64748B]">—</span>;
  return <span className={statusBadgeClass(status)}>{status}</span>;
}
