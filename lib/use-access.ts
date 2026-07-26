'use client';

import { useSession } from 'next-auth/react';

export type AccessState = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isSignedIn: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  /** Only admins may create / update / delete anything. */
  canModify: boolean;
};

/**
 * Client-side access hook.
 *
 * - guest  : not signed in  -> read-only, prices/values masked as "***"
 * - user   : signed in      -> read-only, sees real values
 * - admin  : email listed in ADMIN_USERS env -> full create/update/delete
 */
export function useAccess(): AccessState {
  const { data: session, status } = useSession();
  const isSignedIn = status === 'authenticated' && !!session?.user;
  const isAdmin = isSignedIn && (session?.user as { isAdmin?: boolean })?.isAdmin === true;

  return {
    status,
    isSignedIn,
    isGuest: !isSignedIn,
    isAdmin,
    canModify: isAdmin,
  };
}
