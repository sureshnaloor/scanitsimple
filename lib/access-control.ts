import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { isAdminEmail } from '@/lib/admin-users';

export { getAdminEmails, isAdminEmail } from '@/lib/admin-users';

export type AccessContext = {
  session: Awaited<ReturnType<typeof getServerSession>>;
  isSignedIn: boolean;
  isGuest: boolean;
  isAdmin: boolean;
};

/** Resolve the current request's access context (server-side). */
export async function getAccessContext(): Promise<AccessContext> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const isSignedIn = !!session?.user;
  return {
    session,
    isSignedIn,
    isGuest: !isSignedIn,
    isAdmin: isSignedIn && isAdminEmail(email),
  };
}

/* ------------------------------------------------------------------ */
/* Sensitive-field masking                                             */
/* ------------------------------------------------------------------ */

/**
 * A key is considered sensitive when any of its word parts ends with one of
 * these suffixes (e.g. assetvalue, acquiredvalue, sourceUnitRate, toolCost,
 * purchasePrice, salvageValue, accumulatedDepreciation, amount ...).
 */
const SENSITIVE_SUFFIXES = [
  'price',
  'cost',
  'value',
  'rate',
  'amount',
  'salvage',
  'depreciation',
];

const SENSITIVE_TOKENS = new Set(SENSITIVE_SUFFIXES);

export function isSensitiveKey(key: string): boolean {
  // split camelCase and snake/kebab-case into lowercase word tokens
  const tokens = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return tokens.some((token) => {
    if (SENSITIVE_TOKENS.has(token)) return true;
    // all-lowercase compound keys like "acquiredvalue", "totalamount"
    return SENSITIVE_SUFFIXES.some(
      (suffix) => token.length > suffix.length && token.endsWith(suffix)
    );
  });
}

export const MASKED_VALUE = '***';

/**
 * Deep-walk a JSON payload and replace every sensitive field value with "***".
 * Used for guest (not-signed-in) responses.
 */
export function maskSensitiveData<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item)) as unknown as T;
  }
  if (data && typeof data === 'object') {
    // Leave Date / Buffer-like objects untouched
    if (data instanceof Date) return data;
    const source = data as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && value !== undefined && value !== '' && isSensitiveKey(key)) {
        out[key] = MASKED_VALUE;
      } else {
        out[key] = maskSensitiveData(value);
      }
    }
    return out as unknown as T;
  }
  return data;
}
