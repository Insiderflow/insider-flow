/**
 * Canonical weekly publication (hero CTAs, footer, SubstackPromoBand, upgrade page, nav).
 * https://insiderflow.substack.com/
 *
 * Override with NEXT_PUBLIC_SUBSTACK_URL only if the publication URL changes.
 */
export const SUBSTACK_PUBLISH_URL = 'https://insiderflow.substack.com';

export function getSubstackPublishUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUBSTACK_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  return SUBSTACK_PUBLISH_URL;
}

/** Homepage “latest trades” card grid count (free preview). */
export const HOME_LATEST_TRADES_PREVIEW = 20;
