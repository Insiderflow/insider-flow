/**
 * Insider Flow — API Endpoints
 * ─────────────────────────────────────────────────────────────
 * Every backend call lives here. Pages/components must NEVER
 * call apiClient directly from UI components — use these functions.
 *
 * Naming convention: verb + resource (e.g. fetchPoliticianTrades, postWatchlistItem)
 */

import { apiClient } from './client';
import {
  clearMobileTokens,
  getRefreshToken,
  isMobileTransport,
  setMobileTokens,
} from '@/lib/authTransport';
import type {
  // Auth
  AuthVerifyResponse,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UserProfile,
  // Notifications
  NotificationSettings,
  // Trades
  PoliticianTrade,
  CorporateTrade,
  OpenInsiderTransaction,
  OpenInsiderCompany,
  OpenInsiderOwner,
  // Search
  SearchResponse,
  SuggestResponse,
  // Watchlist
  WatchlistItem,
  WatchlistQueryParams,
  WatchlistCreatePayload,
  // Analytics
  PriceHistoryResponse,
  PortfolioComparisonResponse,
  LatestInsiderDateResponse,
  // Billing
  StripeCheckoutRequest,
  StripeCheckoutResponse,
  StripePortalResponse,
  // Alerts
  Alert,
  AlertUnreadCountResponse,
  // Dashboard
  DashboardStats,
} from './types';

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export const authEndpoints = {
  verify: () =>
    apiClient.get<{ user: UserProfile }>(isMobileTransport() ? '/api/mobile/auth/me' : '/api/auth/me')
      .then((res) => ({ authenticated: Boolean(res.user), user: res.user } as AuthVerifyResponse))
      .catch(() => ({ authenticated: false, user: null } as AuthVerifyResponse)),

  login: async (payload: LoginRequest) => {
    if (isMobileTransport()) {
      const response = await apiClient.post<{
        user: UserProfile;
        accessToken: string;
        refreshToken: string;
      }>('/api/mobile/auth/login', payload);
      setMobileTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      return response;
    }
    return apiClient.post<{ user: UserProfile; token: string }>('/api/auth/login', payload);
  },

  register: (payload: RegisterRequest) =>
    apiClient.post<{ user: UserProfile; token: string }>('/api/auth/register', payload),

  logout: async () => {
    if (isMobileTransport()) {
      try {
        const refreshToken = getRefreshToken();
        await apiClient.post<void>('/api/mobile/auth/logout', { refreshToken });
      } finally {
        clearMobileTokens();
      }
      return;
    }
    return apiClient.post<void>('/api/auth/logout');
  },

  logoutAll: () =>
    apiClient.post<void>('/api/auth/logout-all'),

  requestPasswordReset: (payload: PasswordResetRequest) =>
    apiClient.post<void>('/api/auth/request-password-reset', payload),

  resetPassword: (payload: ResetPasswordRequest) =>
    apiClient.post<void>('/api/auth/reset-password', {
      token: payload.token,
      password: payload.new_password,
    }),
};

// ─────────────────────────────────────────────
// Account
// ─────────────────────────────────────────────

export const accountEndpoints = {
  getNotificationSettings: () =>
    apiClient.get<NotificationSettings>('/api/account/notification-settings'),

  updateNotificationSettings: (payload: Partial<NotificationSettings>) =>
    apiClient.post<NotificationSettings>('/api/account/notification-settings', payload),

  changePassword: (payload: ChangePasswordRequest) =>
    apiClient.post<void>('/api/account/change-password', payload),
};

// ─────────────────────────────────────────────
// Search & Suggest
// ─────────────────────────────────────────────

export const searchEndpoints = {
  search: (q: string, signal?: AbortSignal) =>
    apiClient.get<SearchResponse>('/api/search', { q }, signal),

  suggestPoliticians: (q: string, signal?: AbortSignal) =>
    apiClient.get<{ names: string[] }>('/api/suggest/politicians', { q }, signal),

  suggestIssuers: (q: string, signal?: AbortSignal) =>
    apiClient.get<{ names: string[] }>('/api/suggest/issuers', { q }, signal),
};

// ─────────────────────────────────────────────
// Politician Trades
// ─────────────────────────────────────────────

export const politicianEndpoints = {
  listTrades: (params?: { limit?: number; sort?: string }) =>
    apiClient.get<PoliticianTrade[]>('/api/politician-trades', params as any),

  getTradesByName: (name: string) =>
    apiClient.get<PoliticianTrade[]>('/api/politician-trades', { politician: name }),

  getPortfolioComparison: (
    politician: string,
    opts?: { start_date?: string; china_filter?: boolean },
  ) =>
    apiClient.get<PortfolioComparisonResponse>(
      `/api/portfolio_comparison/${encodeURIComponent(politician)}`,
      opts as any,
    ),
};

// ─────────────────────────────────────────────
// Corporate Insider Trades
// ─────────────────────────────────────────────

export const corporateEndpoints = {
  listTrades: (params?: { limit?: number; sort?: string }) =>
    apiClient.get<CorporateTrade[]>('/api/corporate-trades', params as any),
};

// ─────────────────────────────────────────────
// OpenInsider Explorer
// ─────────────────────────────────────────────

export const openInsiderEndpoints = {
  listTransactions: (params?: { limit?: number }) =>
    apiClient.get<OpenInsiderTransaction[]>('/api/openinsider/transactions', params as any),

  listCompanies: (params?: { limit?: number }) =>
    apiClient.get<OpenInsiderCompany[]>('/api/openinsider/companies', params as any),

  listOwners: (params?: { limit?: number }) =>
    apiClient.get<OpenInsiderOwner[]>('/api/openinsider/owners', params as any),

  getLatestDate: () =>
    apiClient.get<LatestInsiderDateResponse>('/api/insider/latest-date'),
};

// ─────────────────────────────────────────────
// Price / Market Data
// ─────────────────────────────────────────────

export const marketEndpoints = {
  getPriceHistory: (
    ticker: string,
    opts: { startDate: string; endDate: string },
  ) =>
    apiClient.get<PriceHistoryResponse>(
      `/api/price-history/${encodeURIComponent(ticker)}`,
      opts as any,
    ),

  /** Fallback Yahoo Finance path */
  getYahooPrice: (
    ticker: string,
    opts: { period1: string | number; period2: string | number },
  ) =>
    apiClient.get<PriceHistoryResponse>(
      `/api/yahoo-price/${encodeURIComponent(ticker)}`,
      opts as any,
    ),
};

// ─────────────────────────────────────────────
// Watchlist
// ─────────────────────────────────────────────

export const watchlistEndpoints = {
  getItems: (params?: WatchlistQueryParams) =>
    apiClient.get<{ watchlist: WatchlistItem[] }>('/api/watchlist', params as any),

  addItem: (payload: WatchlistCreatePayload) =>
    apiClient.post<{ watchlistItem: WatchlistItem }>('/api/watchlist', payload),

  removeItem: (params: WatchlistQueryParams) =>
    apiClient.delete<void>('/api/watchlist', params as any),
};

// ─────────────────────────────────────────────
// Billing
// ─────────────────────────────────────────────

export const billingEndpoints = {
  createCheckout: (payload: StripeCheckoutRequest) =>
    apiClient.post<StripeCheckoutResponse>('/api/stripe/checkout', payload),

  openPortal: () =>
    apiClient.post<StripePortalResponse>('/api/stripe/portal'),
};

// ─────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────

export const alertEndpoints = {
  list: () =>
    apiClient.get<Alert[]>('/api/alerts'),

  unreadCount: () =>
    apiClient.get<AlertUnreadCountResponse>('/api/alerts/unread-count'),

  markRead: (id: string) =>
    apiClient.post<void>(`/api/alerts/${id}/read`),

  markAllRead: () =>
    apiClient.post<void>('/api/alerts/read-all'),
};

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

export const dashboardEndpoints = {
  getStats: () =>
    apiClient.get<DashboardStats>('/api/dashboard/stats'),
};