'use client';
import { SessionProvider } from 'next-auth/react';
import { AdminGate } from '@/components/access/AdminGate';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminGate>{children}</AdminGate>
    </SessionProvider>
  );
}