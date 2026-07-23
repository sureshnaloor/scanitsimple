'use client';

import { ReactNode } from 'react';

import ThemedPageShell from '@/app/components/ThemedPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';

type Props = {
  title: string;
  subtitle: string;
  hint?: string;
  searchArea: ReactNode;
  loading: boolean;
  showResults: boolean;
  emptyContent: ReactNode;
  resultsSummary?: ReactNode;
  children?: ReactNode;
};

export default function SearchPageLayout({
  title,
  subtitle,
  hint,
  searchArea,
  loading,
  showResults,
  emptyContent,
  resultsSummary,
  children,
}: Props) {
  const s = useThemeSurfaces();

  return (
    <ThemedPageShell>
      <div className="flex flex-col gap-6">
        <div className={`${s.card} ${s.cardPadding}`}>
          <h1 className={s.heroTitle}>{title}</h1>
          <p className={`mt-2 ${s.heroSubtitle}`}>{subtitle}</p>
        </div>

        <div className={`${s.card} p-6`}>
          {searchArea}
          {hint ? <p className={`mt-3 text-xs ${s.textMuted}`}>{hint}</p> : null}
        </div>

        <div className={s.tableWrap}>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className={s.spinner} />
            </div>
          ) : !showResults ? (
            <div className={`py-8 text-center ${s.textMuted}`}>{emptyContent}</div>
          ) : (
            <>
              {resultsSummary ? (
                <div className={`border-b px-4 py-2 ${s.tableSummaryBorder}`}>
                  <p className={`text-sm ${s.textSecondary}`}>{resultsSummary}</p>
                </div>
              ) : null}
              {children}
            </>
          )}
        </div>
      </div>
    </ThemedPageShell>
  );
}
