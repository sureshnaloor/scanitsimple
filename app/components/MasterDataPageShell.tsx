'use client';

import { type ReactNode } from 'react';

import ThemedPageShell from '@/app/components/ThemedPageShell';

type Props = {
  children: ReactNode;
};

export default function MasterDataPageShell({ children }: Props) {
  return (
    <ThemedPageShell className="p-6" maxWidth="max-w-5xl">
      <div className="space-y-6">{children}</div>
    </ThemedPageShell>
  );
}
