/**
 * Data loading mode:
 * - live: fetch from insider-flow/web mobile API (recommended)
 * - snapshot: frozen JSON from `npm run snapshot` (captured from live API)
 * - mock: same as live unless VITE_USE_MOCK=true (fixtures for offline UI design)
 */
export type DataSource = 'snapshot' | 'live' | 'mock';

const raw = (import.meta.env.VITE_DATA_SOURCE as string | undefined)?.toLowerCase();

export const DATA_SOURCE: DataSource =
  raw === 'live' || raw === 'mock' || raw === 'snapshot' ? raw : 'live';

export const USE_LIVE_API = DATA_SOURCE === 'live' || DATA_SOURCE === 'mock';
export const USE_SNAPSHOT = DATA_SOURCE === 'snapshot';
export const USE_HARDCODED_MOCK = DATA_SOURCE === 'mock';
