'use client';

import type { ReactNode } from 'react';
import { useAccess } from '@/lib/use-access';

/**
 * Page-level gate for admin-only screens (master data management etc.).
 * Admins see the children; everyone else sees a read-only notice.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { isAdmin, status } = useAccess();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-amber-400/40 bg-amber-400/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-amber-500">Read-only access</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This area allows creating, editing and deleting data. Only admin users
            (listed in the ADMIN_USERS environment variable) can perform those actions.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
