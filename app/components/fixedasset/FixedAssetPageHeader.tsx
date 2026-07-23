import { fap } from '@/lib/fixedAssetPageDesign';

type Props = {
  title: string;
  subtitle: string;
};

export default function FixedAssetPageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-8">
      <h1 className={fap.title}>{title}</h1>
      <p className={fap.subtitle}>{subtitle}</p>
    </header>
  );
}
