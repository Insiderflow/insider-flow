/**
 * Insider Flow — API Mappers
 * ─────────────────────────────────────────────────────────────
 * Transform raw entity / backend shapes into the canonical types
 * defined in types.ts.  The adapter layer (index.js) calls these
 * before returning data to pages/components.
 *
 * Rule: nothing from raw entity land should leak past these functions.
 */

import type {
  PoliticianTrade,
  CorporateTrade,
  OpenInsiderTransaction,
  OpenInsiderCompany,
  OpenInsiderOwner,
  WatchlistItem,
  Alert,
  PoliticianSearchResult,
  IssuerSearchResult,
  InsiderSearchResult,
  UserProfile,
  SubscriptionStatus,
  BillingProvider,
  PricePoint,
} from './types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Safely coerce a value to a number, returning 0 on NaN/null/undefined. */
function toNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

/** Ensure string or empty-string fallback. */
function toStr(v: unknown): string {
  return v == null ? '' : String(v);
}

/** Normalise a date string to YYYY-MM-DD; returns '' if unparseable. */
function toDate(v: unknown): string {
  if (!v) return '';
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// Politician Trade
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPoliticianTrade(raw: any): PoliticianTrade {
  return {
    id:               toStr(raw.id),
    politician_name:  toStr(raw.politician_name),
    party:            raw.party ?? 'Independent',
    chamber:          raw.chamber ?? 'House',
    state:            toStr(raw.state),
    ticker:           toStr(raw.ticker).toUpperCase(),
    company_name:     toStr(raw.company_name),
    trade_type:       raw.trade_type === 'Sell' ? 'Sell' : 'Buy',
    amount_range:     toStr(raw.amount_range),
    trade_date:       toDate(raw.trade_date),
    disclosure_date:  toDate(raw.disclosure_date),
    sector:           toStr(raw.sector),
    committees:       toStr(raw.committees),
    notable:          Boolean(raw.notable),
    avatar_url:       raw.avatar_url ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPoliticianTrades(raw: any[]): PoliticianTrade[] {
  return (raw ?? []).map(mapPoliticianTrade);
}

// ─────────────────────────────────────────────
// Corporate Trade
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCorporateTrade(raw: any): CorporateTrade {
  return {
    id:                   toStr(raw.id),
    insider_name:         toStr(raw.insider_name),
    title:                toStr(raw.title),
    ticker:               toStr(raw.ticker).toUpperCase(),
    company_name:         toStr(raw.company_name),
    trade_type:           raw.trade_type === 'Sell' ? 'Sell' : 'Buy',
    shares:               toNum(raw.shares),
    price_per_share:      toNum(raw.price_per_share),
    total_value:          toNum(raw.total_value),
    trade_date:           toDate(raw.trade_date),
    filing_date:          toDate(raw.filing_date),
    sector:               toStr(raw.sector),
    ownership_change_pct: toNum(raw.ownership_change_pct),
    notable:              Boolean(raw.notable),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCorporateTrades(raw: any[]): CorporateTrade[] {
  return (raw ?? []).map(mapCorporateTrade);
}

// ─────────────────────────────────────────────
// OpenInsider
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOITransaction(raw: any): OpenInsiderTransaction {
  return {
    id:               toStr(raw.id),
    transaction_date: toDate(raw.transaction_date),
    trade_date:       toDate(raw.trade_date),
    transaction_type: toStr(raw.transaction_type),
    ticker:           toStr(raw.ticker).toUpperCase(),
    company_name:     toStr(raw.company_name),
    owner_name:       toStr(raw.owner_name),
    owner_title:      toStr(raw.owner_title),
    shares:           toNum(raw.shares),
    price:            toNum(raw.price),
    value:            toStr(raw.value),
    value_numeric:    toNum(raw.value_numeric),
    sector:           toStr(raw.sector),
    notable:          Boolean(raw.notable),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOITransactions(raw: any[]): OpenInsiderTransaction[] {
  return (raw ?? []).map(mapOITransaction);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOICompany(raw: any): OpenInsiderCompany {
  return {
    id:              toStr(raw.id),
    ticker:          toStr(raw.ticker).toUpperCase(),
    company_name:    toStr(raw.company_name),
    sector:          toStr(raw.sector),
    country:         toStr(raw.country) || 'US',
    trade_count:     toNum(raw.trade_count),
    last_trade_date: toDate(raw.last_trade_date),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOICompanies(raw: any[]): OpenInsiderCompany[] {
  return (raw ?? []).map(mapOICompany);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOIOwner(raw: any): OpenInsiderOwner {
  return {
    id:              toStr(raw.id),
    owner_name:      toStr(raw.owner_name),
    owner_title:     toStr(raw.owner_title),
    company_name:    toStr(raw.company_name),
    ticker:          toStr(raw.ticker).toUpperCase(),
    trade_count:     toNum(raw.trade_count),
    last_trade_date: toDate(raw.last_trade_date),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOIOwners(raw: any[]): OpenInsiderOwner[] {
  return (raw ?? []).map(mapOIOwner);
}

// ─────────────────────────────────────────────
// Watchlist
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapWatchlistItem(raw: any): WatchlistItem {
  const rawType = raw.watchlist_type ?? raw.type ?? 'ticker';
  const normalizedType = rawType === 'stock' ? 'ticker' : rawType;
  const identifier =
    raw.identifier ??
    raw.politician_id ??
    raw.company_id ??
    raw.owner_id ??
    raw.ticker ??
    '';
  const label =
    raw.label ??
    raw.Politician?.name ??
    raw.Company?.name ??
    raw.Owner?.name ??
    raw.ticker ??
    '';

  return {
    id:           toStr(raw.id),
    type:         normalizedType,
    identifier:   toStr(identifier),
    label:        toStr(label),
    notes:        toStr(raw.notes),
    created_date: toDate(raw.created_date ?? raw.created_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapWatchlistItems(raw: any[]): WatchlistItem[] {
  return (raw ?? []).map(mapWatchlistItem);
}

// ─────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAlert(raw: any): Alert {
  return {
    id:        toStr(raw.id),
    type:      raw.type ?? 'notable_trade',
    title:     toStr(raw.title),
    body:      toStr(raw.body),
    timestamp: toStr(raw.timestamp),
    read:      Boolean(raw.read),
    ticker:    raw.ticker ? toStr(raw.ticker).toUpperCase() : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAlerts(raw: any[]): Alert[] {
  return (raw ?? []).map(mapAlert);
}

// ─────────────────────────────────────────────
// Price / Market data
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPricePoint(raw: any): PricePoint {
  return {
    date:   toDate(raw.date ?? raw.Date ?? raw.timestamp),
    close:  toNum(raw.close ?? raw.Close ?? raw.adjclose),
    open:   raw.open   != null ? toNum(raw.open)   : undefined,
    high:   raw.high   != null ? toNum(raw.high)   : undefined,
    low:    raw.low    != null ? toNum(raw.low)    : undefined,
    volume: raw.volume != null ? toNum(raw.volume) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPricePoints(raw: any[]): PricePoint[] {
  return (raw ?? []).map(mapPricePoint).filter(p => p.date && p.close > 0);
}

// ─────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapUserProfile(raw: any): UserProfile {
  const status: SubscriptionStatus =
    (['free', 'active', 'trialing', 'grace_period', 'expired', 'canceled'] as const).includes(
      raw.subscription_status,
    )
      ? raw.subscription_status
      : 'free';

  const billingProvider: BillingProvider =
    raw.billing_provider === 'stripe' ||
    raw.billing_provider === 'apple' ||
    raw.billing_provider === 'google'
      ? raw.billing_provider
      : null;

  return {
    id:                     toStr(raw.id),
    email:                  toStr(raw.email),
    full_name:              toStr(raw.full_name),
    role:                   raw.role === 'admin' ? 'admin' : 'user',
    membership_tier:
      raw.membership_tier === 'pro' || raw.membership_tier === 'premium'
        ? raw.membership_tier
        : 'free',
    membership_expires_at:  raw.membership_expires_at ?? null,
    subscription_status:    status,
    billing_provider:       billingProvider,
    created_date:           toDate(raw.created_date),
  };
}

// ─────────────────────────────────────────────
// Search results
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPoliticianSearchResult(raw: any): PoliticianSearchResult {
  return {
    kind:            'politician',
    id:              toStr(raw.id ?? raw.politician_name),
    name:            toStr(raw.politician_name ?? raw.name),
    party:           raw.party ?? 'Independent',
    chamber:         raw.chamber ?? 'House',
    state:           toStr(raw.state),
    last_trade_date: toDate(raw.last_trade_date ?? raw.trade_date),
    avatar_url:      raw.avatar_url ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapIssuerSearchResult(raw: any): IssuerSearchResult {
  return {
    kind:            'issuer',
    ticker:          toStr(raw.ticker).toUpperCase(),
    company_name:    toStr(raw.company_name),
    sector:          toStr(raw.sector),
    last_trade_date: toDate(raw.last_trade_date ?? raw.trade_date),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInsiderSearchResult(raw: any): InsiderSearchResult {
  return {
    kind:            'insider',
    name:            toStr(raw.insider_name ?? raw.owner_name ?? raw.name),
    title:           toStr(raw.title ?? raw.owner_title),
    ticker:          toStr(raw.ticker).toUpperCase(),
    company_name:    toStr(raw.company_name),
    last_trade_date: toDate(raw.last_trade_date ?? raw.trade_date),
  };
}