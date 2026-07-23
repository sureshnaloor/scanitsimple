/**
 * Ensures NextAuth env vars exist before next-auth reads process.env.
 * Avoids [next-auth][warn][NEXTAUTH_URL] in local development.
 */
export function ensureAuthEnv(): void {
  if (!process.env.NEXTAUTH_URL) {
    if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.AUTH_URL) {
      process.env.NEXTAUTH_URL = process.env.AUTH_URL.replace(/\/api\/auth\/?$/, '');
    } else {
      const port = process.env.PORT || '3000';
      const hostname = process.env.HOSTNAME || 'localhost';
      process.env.NEXTAUTH_URL = `http://${hostname}:${port}`;
    }
  }

  if (!process.env.NEXTAUTH_SECRET && process.env.AUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;
  }
}

ensureAuthEnv();

export function getAppBaseUrl(): string {
  ensureAuthEnv();
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}
