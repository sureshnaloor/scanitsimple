'use client';

import { type ReactNode } from 'react';

import ThemedPageShell from '@/app/components/ThemedPageShell';

type Props = {
  children: ReactNode;
};

export default function FixedAssetListShell({ children }: Props) {
  return (
    <ThemedPageShell className="px-4 py-8 md:px-8 md:py-12" maxWidth="max-w-[1440px]">
      {children}
    </ThemedPageShell>
  );
}
