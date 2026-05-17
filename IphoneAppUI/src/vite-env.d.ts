/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DATA_SOURCE?: 'snapshot' | 'live' | 'mock';
  readonly VITE_USE_MOCK?: string;
  readonly VITE_AUTH_TRANSPORT?: string;
  readonly VITE_DEV_API_PROXY?: string;
  readonly VITE_STRIPE_PRICE_ID?: string;
  readonly VITE_PROFILE_MOCK_FIRST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
