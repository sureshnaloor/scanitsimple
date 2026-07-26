'use client';

import type { ReactNode } from 'react';
import { useAccess } from '@/lib/use-access';

/**
 * Renders children only for admin users (email in ADMIN_USERS env).
 * Use to gate EDIT buttons, create forms, delete actions, etc.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAccess();
  if (!isAdmin) return null;
  return <>{children}</>;
}

/**
 * Renders children for everyone EXCEPT admins — useful for read-only hints.
 */
export function NonAdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAccess();
  if (isAdmin) return null;
  return <>{children}</>;
}

/**
 * Displays a sensitive value (price / value / cost / rate ...).
 * Guests always see "***". Signed-in users see the formatted value.
 * (The API already masks guest payloads server-side; this is a belt-and-braces
 * display helper for any client-side rendering path.)
 */
export function SensitiveValue({
  value,
  format,
  fallback = 'N/A',
}: {
  value: unknown;
  format?: (v: never) => ReactNode;
  fallback?: ReactNode;
}) {
  const { isGuest } = useAccess();

  if (isGuest || value === '***') return <>***</>;
  if (value === null || value === undefined || value === '') return <>{fallback}</>;
  if (format && (typeof value === 'number' || typeof value === 'string')) {
    return <>{format(value as never)}</>;
  }
  return <>{String(value)}</>;
}
