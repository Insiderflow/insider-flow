import { apiClient } from './client';
import { getRefreshToken } from './authTransport';
import type { AuthUser } from '@/context/AuthContext';
import type {
  DashboardPayload,
  IndustryDetailPayload,
  Period,
  PrimeBrokerDetail,
} from '@/data/mockData';
import type { DataMode } from '@/context/DataModeContext';
import type {
  InsiderCompanyProfile,
  InsiderEntityProfile,
} from '@/data/insiderEntities';
import type { IssuerProfile } from '@/data/issuerProfile';

export interface LiveFeedResponse {
  trades: Array<{
    id: string;
    ticker: string;
    displayName: string;
    title: string;
    titleKey?: string;
    politicianId?: string;
    imageUrl?: string;
    showParty: boolean;
    party?: 'R' | 'D' | 'I';
    side: string;
    disclosureBadge: string;
    metricLabel: 'holdings' | 'outstanding';
    metricValue: string;
    metricPositive?: boolean;
    filedDisplay: string;
    priceDisplay: string;
    totalValueDisplay: string;
    dateKey: string;
    profilePath?: string;
  }>;
  dates: Array<{ id: string; label: string }>;
  etClock: string;
  marketOpen: boolean;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface WatchlistItem {
  id: string;
  watchlist_type: string;
  politician_id?: string | null;
  company_id?: string | null;
  owner_id?: string | null;
  ticker?: string | null;
  display_name?: string;
  sector?: string | null;
  avatar_url?: string;
  Politician?: {
    id: string;
    name: string;
    party?: string | null;
    state?: string | null;
  } | null;
  Company?: {
    id: string;
    name?: string | null;
    ticker?: string | null;
  } | null;
  Owner?: {
    id: string;
    name?: string | null;
  } | null;
}

export const mobileApi = {
  dashboard: (mode: DataMode, period: Period, locale: string) =>
    apiClient.get<DashboardPayload>('/api/mobile/dashboard', { mode, period, locale }),

  primeBroker: (slug: string, period: Period) =>
    apiClient.get<PrimeBrokerDetail>('/api/mobile/prime-broker', { slug, period }),

  industryDetail: (
    sector: string,
    side: 'buy' | 'sell',
    period: Period
  ) =>
    apiClient.get<IndustryDetailPayload>('/api/mobile/industry-detail', {
      sector,
      side,
      period,
    }),

  live: (mode: DataMode) =>
    apiClient.get<LiveFeedResponse>('/api/mobile/live', { mode }),

  companyProfile: (ticker: string) =>
    apiClient.get<InsiderCompanyProfile>('/api/mobile/company-profile', { ticker }),

  personProfile: (params: { politicianId?: string; name?: string; ownerId?: string }) =>
    apiClient.get<InsiderEntityProfile & { party?: string }>(
      '/api/mobile/person-profile',
      params
    ),

  issuerProfile: (idOrTicker: string) =>
    apiClient.get<IssuerProfile>('/api/mobile/issuer-profile', { issuerId: idOrTicker }),

  search: (q: string) =>
    apiClient.get<{ results: SearchResult[] }>('/api/search', { q }),

  watchlist: (params?: Record<string, string>) =>
    apiClient
      .get<{ watchlist: WatchlistItem[] }>('/api/watchlist', params)
      .then((r) => r.watchlist ?? []),

  watchlistAdd: (body: {
    type: 'politician' | 'company' | 'owner' | 'stock';
    politicianId?: string;
    companyId?: string;
    ownerId?: string;
    ticker?: string;
  }) => apiClient.post<{ watchlistItem: WatchlistItem }>('/api/watchlist', body),

  watchlistRemove: (params: Record<string, string>) =>
    apiClient.delete<void>('/api/watchlist', params),

  politicianTrades: (params?: { limit?: number; politician?: string; ticker?: string }) =>
    apiClient.get<unknown[]>('/api/politician-trades', {
      limit: params?.limit ?? 100,
      sort: '-trade_date',
      politician: params?.politician,
      ticker: params?.ticker,
    }),

  corporateTrades: (params?: { limit?: number; ticker?: string }) =>
    apiClient.get<unknown[]>('/api/corporate-trades', {
      limit: params?.limit ?? 100,
      sort: '-trade_date',
      ticker: params?.ticker,
    }),

  authMe: () => apiClient.get<{ user: AuthUser }>('/api/mobile/auth/me'),

  authLogin: (email: string, password: string) =>
    apiClient.post<{
      user: { id: string; email: string };
      accessToken: string;
      refreshToken: string;
    }>('/api/mobile/auth/login', { email, password }),

  authRegister: (email: string, password: string, name?: string) =>
    apiClient.post<{ message: string; requires_verification?: boolean }>(
      '/api/auth/register',
      { email, password, name: name?.trim() || undefined }
    ),

  authLogout: () =>
    apiClient.post<void>('/api/mobile/auth/logout', {
      refreshToken: getRefreshToken(),
    }),

  billingCheckout: (returnUrl: string, plan: 'monthly' | 'yearly') =>
    apiClient.post<{ url: string }>('/api/stripe/checkout', {
      source: 'mobile',
      plan,
      return_url: returnUrl,
    }),

  billingPortal: (returnUrl: string) =>
    apiClient.post<{ url: string }>('/api/stripe/portal', { return_url: returnUrl }),

  billingSync: () =>
    apiClient.post<{
      membership_tier: string;
      subscription_status: string;
      membership_expires_at: string | null;
    }>('/api/mobile/billing/sync'),
};
