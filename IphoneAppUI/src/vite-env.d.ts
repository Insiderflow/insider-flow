/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DATA_SOURCE?: 'snapshot' | 'live' | 'mock';
  readonly VITE_USE_MOCK?: string;
  readonly VITE_AUTH_TRANSPORT?: string;
  readonly VITE_DEV_API_PROXY?: string;
  readonly VITE_STRIPE_PRICE_ID?: string;
  readonly VITE_PROFILE_MOCK_FIRST?: string;
  /** GA4 measurement ID (defaults to G-XNQRFHM8EV in production builds). */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}
