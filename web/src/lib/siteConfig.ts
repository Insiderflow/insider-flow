/**
 * Public marketing URLs. Prefer setting NEXT_PUBLIC_SUBSTACK_URL in production
 * if your publication lives elsewhere.
 */
export function getSubstackPublishUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUBSTACK_URL?.trim();
  if (fromEnv) return fromEnv;
  return 'https://insiderflow.substack.com';
}

/** Homepage “latest trades” card grid count (free preview). */
export const HOME_LATEST_TRADES_PREVIEW = 20;
