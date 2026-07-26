/**
 * Admin-user resolution.
 *
 * Admins are identified purely through the ADMIN_USERS environment variable.
 * Supported formats (case-insensitive, whitespace-tolerant):
 *   ADMIN_USERS=["a@x.com","b@y.com"]      (JSON-style array)
 *   ADMIN_USERS="a@x.com, b@y.com"         (comma separated)
 *   ADMIN_USERS=a@x.com;b@y.com            (semicolon separated)
 * Only these users may create / update / delete data anywhere in the app.
 */

export function getAdminEmails(): string[] {
  const raw = (process.env.ADMIN_USERS || '').trim();
  if (!raw) return [];

  // JSON-array form: ["a@x.com", "b@y.com"]
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => e.includes('@'));
      }
    } catch {
      // fall through to token-based parsing
    }
  }

  // Plain list form — strip stray quotes/brackets from each token
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase().replace(/^[\["']+|[\]"']+$/g, ''))
    .filter((e) => e.includes('@'));
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
