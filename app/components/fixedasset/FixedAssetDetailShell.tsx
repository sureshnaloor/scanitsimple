'use client';

import { type ReactNode } from 'react';

import ThemedPageShell from '@/app/components/ThemedPageShell';

type Props = {
  children: ReactNode;
};

export default function FixedAssetDetailShell({ children }: Props) {
  return (
    <ThemedPageShell className="px-4 py-6 md:px-8 md:py-10" maxWidth="max-w-[1280px]">
      {children}
    </ThemedPageShell>
  );
}
