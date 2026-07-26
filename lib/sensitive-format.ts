/**
 * Client-safe helpers for rendering sensitive (price/value) fields that the
 * API may have masked as "***" for guest users.
 */

export const MASKED = '***';

export function isMasked(value: unknown): boolean {
  return value === MASKED;
}

/**
 * Use inside table cells / detail views that previously did:
 *   typeof value === 'number' ? formatter(value) : 'N/A'
 * so that guest-masked values render as "***" instead of "N/A".
 */
export function formatSensitiveNumber(
  value: unknown,
  formatter: (v: number) => string,
  fallback = 'N/A'
): string {
  if (isMasked(value)) return MASKED;
  return typeof value === 'number' ? formatter(value) : fallback;
}

/** Generic variant for string-ish sensitive fields. */
export function displaySensitive(value: unknown, fallback = 'N/A'): string {
  if (isMasked(value)) return MASKED;
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}
