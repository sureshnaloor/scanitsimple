// app/components/MasterDataPageShell.tsx
'use client';

import { type ReactNode } from 'react';
import ThemedPageShell from '@/app/components/ThemedPageShell';

type Props = {
  children: ReactNode;
  maxWidth?: string;
};

export default function MasterDataPageShell({ children, maxWidth = 'max-w-[95%]' }: Props) {
  return (
    <ThemedPageShell className="p-6" maxWidth={maxWidth}>
      <div className="space-y-6">{children}</div>
    </ThemedPageShell>
  );
}
