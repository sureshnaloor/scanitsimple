/**
 * Hand-crafted SVG illustrations for each asset category.
 * All artwork is vector-only (no bitmaps) and adapts to light/dark themes
 * via CSS design tokens; per-category accent gradients give each card its
 * own identity.
 */

export type CategoryArtName =
  | 'it'
  | 'vehicles'
  | 'real-estate'
  | 'medical'
  | 'measuring'
  | 'camp';

interface ArtProps {
  className?: string;
}

const OUTLINE = 'var(--color-text-primary)';

/* ─── IT Assets: laptop + server rack + wifi ─── */
function ItArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="art-it" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#0891B2" />
        </linearGradient>
      </defs>

      {/* wifi arcs */}
      <g stroke="url(#art-it)" strokeWidth="3.5" strokeLinecap="round" opacity="0.85">
        <path d="M232 46a34 34 0 0 1 46 0" />
        <path d="M241 57a21 21 0 0 1 28 0" />
      </g>
      <circle cx="255" cy="69" r="4" fill="url(#art-it)" />

      {/* server rack */}
      <g>
        <rect x="212" y="86" width="66" height="80" rx="9" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="221" y={96 + i * 22} width="48" height="14" rx="4" fill="var(--color-primary-slate)" stroke={OUTLINE} strokeOpacity="0.1" strokeWidth="1" />
            <circle cx="229" cy={103 + i * 22} r="2.5" fill="url(#art-it)" />
            <rect x="236" y={101 + i * 22} width="24" height="4" rx="2" fill={OUTLINE} fillOpacity="0.12" />
          </g>
        ))}
      </g>

      {/* laptop */}
      <g>
        <rect x="52" y="58" width="134" height="92" rx="10" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="62" y="68" width="114" height="72" rx="6" fill="url(#art-it)" fillOpacity="0.14" />
        {/* bar chart on screen */}
        <g fill="url(#art-it)">
          <rect x="74" y="108" width="12" height="24" rx="3" />
          <rect x="92" y="96" width="12" height="36" rx="3" opacity="0.85" />
          <rect x="110" y="102" width="12" height="30" rx="3" opacity="0.7" />
          <rect x="128" y="86" width="12" height="46" rx="3" opacity="0.55" />
        </g>
        {/* mini QR on screen */}
        <g fill={OUTLINE} fillOpacity="0.55">
          <rect x="148" y="74" width="6" height="6" rx="1" />
          <rect x="156" y="74" width="6" height="6" rx="1" fillOpacity="0.25" />
          <rect x="148" y="82" width="6" height="6" rx="1" fillOpacity="0.25" />
          <rect x="156" y="82" width="6" height="6" rx="1" />
          <rect x="152" y="90" width="6" height="6" rx="1" fillOpacity="0.4" />
        </g>
        {/* base */}
        <path d="M42 150h154l12 13a6 6 0 0 1-5 9H47a6 6 0 0 1-5-9l12-13Z" fill="var(--color-primary-slate)" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="106" y="155" width="52" height="5" rx="2.5" fill={OUTLINE} fillOpacity="0.1" />
      </g>

      {/* ground shadow */}
      <ellipse cx="160" cy="188" rx="110" ry="7" fill="url(#art-it)" fillOpacity="0.12" />
    </svg>
  );
}

/* ─── Vehicles: delivery truck + road + pin ─── */
function VehiclesArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="art-veh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FB923C" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* location pin */}
      <g>
        <path d="M96 34c-11 0-19 8-19 18 0 13 19 30 19 30s19-17 19-30c0-10-8-18-19-18Z" fill="url(#art-veh)" fillOpacity="0.2" stroke="url(#art-veh)" strokeWidth="2.5" />
        <circle cx="96" cy="52" r="6" fill="url(#art-veh)" />
      </g>

      {/* speed lines */}
      <g stroke="url(#art-veh)" strokeWidth="3.5" strokeLinecap="round" opacity="0.6">
        <path d="M28 92h18" />
        <path d="M20 108h26" />
        <path d="M30 124h16" />
      </g>

      {/* cargo box */}
      <rect x="58" y="76" width="128" height="66" rx="9" fill="url(#art-veh)" fillOpacity="0.16" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
      <rect x="70" y="90" width="72" height="8" rx="4" fill="url(#art-veh)" opacity="0.8" />
      <rect x="70" y="106" width="46" height="8" rx="4" fill={OUTLINE} fillOpacity="0.12" />
      <rect x="70" y="122" width="58" height="8" rx="4" fill={OUTLINE} fillOpacity="0.12" />
      {/* box barcode */}
      <g fill={OUTLINE} fillOpacity="0.4">
        <rect x="152" y="90" width="3" height="40" />
        <rect x="158" y="90" width="5" height="40" />
        <rect x="166" y="90" width="2" height="40" />
        <rect x="171" y="90" width="4" height="40" />
      </g>

      {/* cab */}
      <path d="M186 142V98a10 10 0 0 1 10-10h22a10 10 0 0 1 8 4l18 24a10 10 0 0 1 2 6v20h-60Z" fill="url(#art-veh)" fillOpacity="0.28" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
      <path d="M198 96h16l14 19h-30V96Z" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.15" strokeWidth="1.2" />
      {/* headlight */}
      <rect x="252" y="120" width="8" height="12" rx="3" fill="url(#art-veh)" />

      {/* wheels */}
      {[104, 222].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="152" r="15" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.25" strokeWidth="2" />
          <circle cx={cx} cy="152" r="6" fill="url(#art-veh)" />
        </g>
      ))}

      {/* road */}
      <line x1="16" y1="176" x2="304" y2="176" stroke={OUTLINE} strokeOpacity="0.25" strokeWidth="2.5" strokeDasharray="16 12" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Land & Building: skyline + pin ─── */
function RealEstateArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="art-re" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* sun / beacon */}
      <circle cx="262" cy="42" r="14" fill="url(#art-re)" fillOpacity="0.25" stroke="url(#art-re)" strokeWidth="2" />
      <g stroke="url(#art-re)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
        <path d="M262 18v6M262 60v6M238 42h6M280 42h6M245 25l4 4M275 55l4 4M279 25l-4 4M249 55l-4 4" />
      </g>

      {/* tall tower */}
      <g>
        <rect x="88" y="44" width="70" height="122" rx="6" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 3 }).map((_, c) => (
            <rect
              key={`${r}-${c}`}
              x={99 + c * 18}
              y={56 + r * 21}
              width="12"
              height="13"
              rx="2.5"
              fill={(r + c) % 3 === 0 ? 'url(#art-re)' : OUTLINE}
              fillOpacity={(r + c) % 3 === 0 ? 0.85 : 0.1}
            />
          ))
        )}
        {/* antenna */}
        <line x1="123" y1="44" x2="123" y2="28" stroke="url(#art-re)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="123" cy="25" r="3.5" fill="url(#art-re)" />
      </g>

      {/* low block */}
      <g>
        <rect x="170" y="92" width="76" height="74" rx="6" fill="url(#art-re)" fillOpacity="0.12" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        {Array.from({ length: 2 }).map((_, r) =>
          Array.from({ length: 3 }).map((_, c) => (
            <rect key={`${r}-${c}`} x={181 + c * 20} y={103 + r * 24} width="13" height="15" rx="2.5" fill={OUTLINE} fillOpacity="0.1" />
          ))
        )}
        {/* entrance */}
        <path d="M196 166v-22a12 12 0 0 1 24 0v22h-24Z" fill="url(#art-re)" fillOpacity="0.6" />
      </g>

      {/* tree */}
      <g>
        <rect x="66" y="138" width="6" height="28" rx="3" fill={OUTLINE} fillOpacity="0.3" />
        <circle cx="69" cy="128" r="16" fill="url(#art-re)" fillOpacity="0.35" />
        <circle cx="60" cy="136" r="10" fill="url(#art-re)" fillOpacity="0.25" />
      </g>

      {/* ground */}
      <line x1="32" y1="166" x2="288" y2="166" stroke={OUTLINE} strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="160" cy="188" rx="105" ry="7" fill="url(#art-re)" fillOpacity="0.12" />
    </svg>
  );
}

/* ─── Medical Equipment: vitals monitor ─── */
function MedicalArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="art-med" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* pulse side-rings */}
      <g stroke="url(#art-med)" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M40 84h12l6-14 8 32 7-18h11" />
      </g>

      {/* monitor body */}
      <g>
        <rect x="80" y="46" width="160" height="104" rx="14" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="92" y="58" width="136" height="72" rx="9" fill="url(#art-med)" fillOpacity="0.12" />
        {/* ECG trace */}
        <path
          d="M100 100h22l8-20 10 42 9-30 7 8h20l8-14 9 26 7-12h36"
          stroke="url(#art-med)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* cross badge */}
        <g transform="translate(216 66)">
          <circle r="13" fill="url(#art-med)" />
          <path d="M0-6v12M-6 0h12" stroke="var(--color-primary-navy)" strokeWidth="3.5" strokeLinecap="round" />
        </g>
        {/* controls */}
        <circle cx="100" cy="140" r="3.5" fill="url(#art-med)" />
        <rect x="112" y="137" width="40" height="6" rx="3" fill={OUTLINE} fillOpacity="0.12" />
        <circle cx="228" cy="140" r="3.5" fill={OUTLINE} fillOpacity="0.25" />
      </g>

      {/* stand */}
      <line x1="160" y1="150" x2="160" y2="172" stroke={OUTLINE} strokeOpacity="0.3" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M128 182h64" stroke={OUTLINE} strokeOpacity="0.3" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="128" cy="182" r="5" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="192" cy="182" r="5" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.3" strokeWidth="2" />

      <ellipse cx="160" cy="194" rx="95" ry="5" fill="url(#art-med)" fillOpacity="0.12" />
    </svg>
  );
}

/* ─── Measuring Instruments: dial gauge + readout ─── */
function MeasuringArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="art-msr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* caliper side */}
      <g stroke="url(#art-msr)" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M262 60v56" />
        <path d="M262 60h22" />
        <path d="M262 116h16" />
        <path d="M278 68v12" opacity="0.5" />
      </g>

      {/* dial */}
      <g>
        <circle cx="150" cy="98" r="62" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="150" cy="98" r="52" fill="url(#art-msr)" fillOpacity="0.08" stroke="url(#art-msr)" strokeOpacity="0.5" strokeWidth="2" />
        {/* ticks */}
        {Array.from({ length: 13 }).map((_, i) => {
          const a = (-210 + i * 20) * (Math.PI / 180);
          const x1 = 150 + Math.cos(a) * 44;
          const y1 = 98 + Math.sin(a) * 44;
          const x2 = 150 + Math.cos(a) * (i % 3 === 0 ? 34 : 39);
          const y2 = 98 + Math.sin(a) * (i % 3 === 0 ? 34 : 39);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={OUTLINE} strokeOpacity={i % 3 === 0 ? 0.5 : 0.25} strokeWidth="2.5" strokeLinecap="round" />;
        })}
        {/* needle */}
        <line x1="150" y1="98" x2="176" y2="66" stroke="url(#art-msr)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="150" cy="98" r="7" fill="url(#art-msr)" />
        <circle cx="150" cy="98" r="3" fill="var(--color-primary-navy)" />
      </g>

      {/* digital readout */}
      <g>
        <rect x="112" y="164" width="76" height="22" rx="7" fill="var(--color-primary-navy)" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" />
        <g fill="url(#art-msr)">
          <rect x="122" y="171" width="9" height="8" rx="2" />
          <rect x="135" y="171" width="9" height="8" rx="2" opacity="0.7" />
          <rect x="148" y="171" width="9" height="8" rx="2" opacity="0.45" />
        </g>
        <rect x="163" y="171" width="16" height="8" rx="2" fill={OUTLINE} fillOpacity="0.15" />
      </g>

      <ellipse cx="150" cy="194" rx="90" ry="5" fill="url(#art-msr)" fillOpacity="0.12" />
    </svg>
  );
}

/* ─── Camp Equipment: tent + campfire ─── */
function CampArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 200" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="art-camp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="art-camp-fire" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#F97316" />
          <stop offset="1" stopColor="#FBBF24" />
        </linearGradient>
      </defs>

      {/* stars */}
      <g fill="url(#art-camp)" opacity="0.8">
        <path d="M56 36l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6Z" />
        <path d="M270 52l1.8 4.4 4.4 1.8-4.4 1.8-1.8 4.4-1.8-4.4-4.4-1.8 4.4-1.8 1.8-4.4Z" opacity="0.7" />
        <circle cx="238" cy="28" r="2.5" opacity="0.6" />
      </g>

      {/* tent */}
      <g>
        <path d="M40 158 112 58l72 100H40Z" fill="url(#art-camp)" fillOpacity="0.16" stroke={OUTLINE} strokeOpacity="0.18" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M112 58v100" stroke={OUTLINE} strokeOpacity="0.15" strokeWidth="1.5" />
        <path d="M92 158l20-44 20 44H92Z" fill="var(--color-primary-navy)" stroke="url(#art-camp)" strokeWidth="2" strokeLinejoin="round" />
        {/* flag */}
        <line x1="112" y1="58" x2="112" y2="38" stroke={OUTLINE} strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M112 40h18l-6 6 6 6h-18v-12Z" fill="url(#art-camp)" />
      </g>

      {/* campfire */}
      <g>
        {/* logs */}
        <rect x="204" y="146" width="52" height="9" rx="4.5" transform="rotate(18 204 146)" fill={OUTLINE} fillOpacity="0.35" />
        <rect x="200" y="146" width="52" height="9" rx="4.5" transform="rotate(-14 200 146)" fill={OUTLINE} fillOpacity="0.25" />
        {/* flames */}
        <path d="M230 88c10 14 22 22 22 40a22 22 0 1 1-44 0c0-18 12-26 22-40Z" fill="url(#art-camp-fire)" fillOpacity="0.9" />
        <path d="M230 112c5 7 11 11 11 20a11 11 0 1 1-22 0c0-9 6-13 11-20Z" fill="#FDE68A" fillOpacity="0.9" />
      </g>

      {/* ground */}
      <line x1="24" y1="166" x2="296" y2="166" stroke={OUTLINE} strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="160" cy="188" rx="115" ry="7" fill="url(#art-camp)" fillOpacity="0.1" />
    </svg>
  );
}

const ART: Record<CategoryArtName, (props: ArtProps) => JSX.Element> = {
  it: ItArt,
  vehicles: VehiclesArt,
  'real-estate': RealEstateArt,
  medical: MedicalArt,
  measuring: MeasuringArt,
  camp: CampArt,
};

export function CategoryArt({ name, className }: { name: CategoryArtName; className?: string }) {
  const Art = ART[name];
  return <Art className={className} />;
}
