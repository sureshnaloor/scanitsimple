import { NextResponse } from 'next/server';
import { getAccessContext, maskSensitiveData } from '@/lib/access-control';

/**
 * Drop-in replacement for NextResponse.json used by API route handlers.
 *
 * - Signed-in users (and admins) receive the payload unchanged.
 * - Guests (not signed in) receive the same payload with every sensitive
 *   field (price / value / cost / rate / amount / depreciation ...) masked
 *   as "***" so that no real figure ever leaves the server.
 */
export async function apiJson(data: unknown, init?: ResponseInit) {
  try {
    const { isGuest } = await getAccessContext();
    return NextResponse.json(isGuest ? maskSensitiveData(data) : data, init);
  } catch {
    // If session resolution fails, fail safe and mask everything.
    return NextResponse.json(maskSensitiveData(data), init);
  }
}
