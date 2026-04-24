/**
 * Insider Flow — API Contract Types
 * All data shapes that cross the API boundary live here.
 * Pages/components must only consume these types; never raw entity shapes.
 */

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type TradeType = 'Buy' | 'Sell';
export type Party = 'Democrat' | 'Republican' | 'Independent';
export type Chamber = 'Senate' | 'House';
export type WatchlistItemType = 'ticker' | 'politician' | 'insider';
export type BillingProvider = 'stripe' | 'apple' | 'google' | null;

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'trialing'
  | 'grace_period'
  | 'expired'
  | 'canceled';

export type AlertType = 'notable_trade' | 'politician' | 'watchlist' | 'corporate';

// ─────────────────────────────────────────────
// User / Auth
// ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  membership_tier: 'free' | 'pro' | 'premium';
  membership_expires_at: string | null; // ISO-8601
  subscription_status: SubscriptionStatus;
  billing_provider: BillingProvider;
  created_date: string;
}

export interface AuthVerifyResponse {
  authenticated: boolean;
  user: UserProfile | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ─────────────────────────────────────────────
// Notification Settings
// ─────────────────────────────────────────────

export interface NotificationSettings {
  notable_trades: boolean;
  politician_alerts: boolean;
  watchlist_activity: boolean;
  corporate_insiders: boolean;
  email_digest: boolean;
  push_enabled: boolean;
}

// ─────────────────────────────────────────────
// Trades
// ─────────────────────────────────────────────

export interface PoliticianTrade {
  id: string;
  politician_name: string;
  party: Party;
  chamber: Chamber;
  state: string;
  ticker: string;
  company_name: string;
  trade_type: TradeType;
  amount_range: string;
  trade_date: string; // YYYY-MM-DD
  disclosure_date: string;
  sector: string;
  committees: string;
  notable: boolean;
  avatar_url: string | null;
}

export interface CorporateTrade {
  id: string;
  insider_name: string;
  title: string;
  ticker: string;
  company_name: string;
  trade_type: TradeType;
  shares: number;
  price_per_share: number;
  total_value: number;
  trade_date: string;
  filing_date: string;
  sector: string;
  ownership_change_pct: number;
  notable: boolean;
}

export interface OpenInsiderTransaction {
  id: string;
  transaction_date: string;
  trade_date: string;
  transaction_type: string; // e.g. "P - Purchase"
  ticker: string;
  company_name: string;
  owner_name: string;
  owner_title: string;
  shares: number;
  price: number;
  value: string;          // formatted e.g. "$4.4M"
  value_numeric: number;
  sector: string;
  notable: boolean;
}

export interface OpenInsiderCompany {
  id: string;
  ticker: string;
  company_name: string;
  sector: string;
  country: string;
  trade_count: number;
  last_trade_date: string;
}

export interface OpenInsiderOwner {
  id: string;
  owner_name: string;
  owner_title: string;
  company_name: string;
  ticker: string;
  trade_count: number;
  last_trade_date: string;
}

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

export type SearchResultKind = 'politician' | 'issuer' | 'insider';

export interface PoliticianSearchResult {
  kind: 'politician';
  id: string;
  name: string;
  party: Party;
  chamber: Chamber;
  state: string;
  last_trade_date: string;
  avatar_url: string | null;
}

export interface IssuerSearchResult {
  kind: 'issuer';
  ticker: string;
  company_name: string;
  sector: string;
  last_trade_date: string;
}

export interface InsiderSearchResult {
  kind: 'insider';
  name: string;
  title: string;
  ticker: string;
  company_name: string;
  last_trade_date: string;
}

export type SearchResult =
  | PoliticianSearchResult
  | IssuerSearchResult
  | InsiderSearchResult;

export interface SearchResponse {
  politicians: PoliticianSearchResult[];
  issuers: IssuerSearchResult[];
  insiders: InsiderSearchResult[];
}

export interface SuggestResponse {
  results: SearchResult[];
}

// ─────────────────────────────────────────────
// Watchlist
// ─────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  type: WatchlistItemType;
  identifier: string;
  label: string;
  notes: string;
  created_date: string;
}

export interface WatchlistQueryParams {
  type?: WatchlistItemType;
  politicianId?: string;
  companyId?: string;
  ownerId?: string;
  ticker?: string;
}

export interface WatchlistCreatePayload {
  type: WatchlistItemType;
  identifier: string;
  label: string;
  notes?: string;
}

// ─────────────────────────────────────────────
// Portfolio / Analytics
// ─────────────────────────────────────────────

export interface PricePoint {
  date: string;      // YYYY-MM-DD
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface PriceHistoryResponse {
  ticker: string;
  points: PricePoint[];
}

export interface PortfolioDataPoint {
  date: string;
  politician_value: number;   // normalized to 100 at start
  spy_value: number;
}

export interface PortfolioComparisonResponse {
  politician: string;
  start_date: string;
  china_filter: boolean;
  data_points: PortfolioDataPoint[];
  total_return_pct: number;
  spy_return_pct: number;
  alpha_pct: number;
}

export interface LatestInsiderDateResponse {
  date: string; // ISO-8601
}

// ─────────────────────────────────────────────
// Billing
// ─────────────────────────────────────────────

export interface StripeCheckoutRequest {
  price_id: string;
  success_url: string;
  cancel_url: string;
}

export interface StripeCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface StripePortalResponse {
  portal_url: string;
}

// ─────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  timestamp: string; // ISO-8601
  read: boolean;
  ticker?: string;
}

export interface AlertUnreadCountResponse {
  unreadCount: number;
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

export interface DashboardStats {
  buysToday: number;
  sellsToday: number;
  activeTraders: number;
  buysDelta: string;
  sellsDelta: string;
  activeDelta: string;
}