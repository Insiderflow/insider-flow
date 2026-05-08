/**
 * Canonical public origin for the Next app (scheme + host, no trailing slash).
 * Prefer setting both `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to the same value
 * (e.g. https://www.insiderflow.asia) so cookies, OAuth, and email links agree.
 */

const DEFAULT_PRODUCTION = "https://www.insiderflow.asia";
const DEFAULT_DEVELOPMENT = "http://localhost:3000";

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

/** Returns URL only when `NEXTAUTH_URL` or `NEXT_PUBLIC_BASE_URL` is set (trimmed). */
export function getPublicAppUrlFromEnv(): string | null {
  for (const raw of [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ]) {
    const v = raw?.trim();
    if (v) return stripTrailingSlash(v);
  }
  return null;
}

/**
 * URL for email links and redirects when env may be missing.
 * Production default matches `middleware` CORS default host (`www`).
 */
export function getPublicAppUrlOrDefault(): string {
  return (
    getPublicAppUrlFromEnv() ??
    (process.env.NODE_ENV === "production"
      ? DEFAULT_PRODUCTION
      : DEFAULT_DEVELOPMENT)
  );
}
