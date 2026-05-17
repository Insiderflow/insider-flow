import {
  DATA_SOURCE,
  USE_HARDCODED_MOCK,
  USE_LIVE_API,
  USE_SNAPSHOT,
} from '@/api/dataSource';

export { DATA_SOURCE, USE_HARDCODED_MOCK, USE_LIVE_API, USE_SNAPSHOT };

/** Explicit TS fixtures (`insiderEntities` / `mockData`). Off by default — use live API or `npm run snapshot`. */
export const USE_FIXTURE_BUILDERS =
  import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === '1';

/** @deprecated use USE_FIXTURE_BUILDERS */
export const USE_MOCK = USE_FIXTURE_BUILDERS;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Live HTTP to insider-flow/web mobile BFF */
export const USE_API = USE_LIVE_API && !USE_FIXTURE_BUILDERS;
