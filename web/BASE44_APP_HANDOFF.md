# Insider Flow -> Base44 App Handoff

## Copy/Paste Prompt for Base44

Use this exact prompt in Base44:

```text
Build a mobile-first app UI/UX for "Insider Flow" that plugs into an existing Next.js + Prisma backend.

Primary goal:
- Redesign and ship app UI/UX without changing core backend data contracts.
- Keep the API contract stable so frontend can be swapped with minimal backend edits.

Business domain:
- Insider trading intelligence product.
- Two data tracks:
  1) Politician trade disclosures (Capitol-style dataset)
  2) OpenInsider corporate insider transactions
- Users can browse/search/filter trades, compare politician portfolio vs S&P500, and manage watchlists.
- Paid users receive enhanced features (membership tier: FREE / PAID).

Existing data model (source of truth):
- User
  - id, email, password_hash, email_verified, membership_tier, membership_expires_at
  - stripe_customer_id, stripe_subscription_id
  - notification_settings (JSON)
- Politician
  - id, name, party, chamber, state
- Issuer
  - id, name, ticker, sector, country
- Trade
  - id, politician_id, issuer_id, traded_at, published_at, type
  - size_min, size_max, price, filed_after_days, owner, source_url, raw (JSON)
- OpenInsiderCompany
  - id, ticker, name
- OpenInsiderOwner
  - id, name, title, isInstitution
- OpenInsiderTransaction
  - id, transactionDate, tradeDate, transactionType
  - lastPrice, quantity, sharesHeld, owned, value, valueNumeric
  - companyId, ownerId
- UserWatchlist
  - id, user_id, watchlist_type ('politician'|'company'|'owner'|'stock')
  - politician_id, company_id, owner_id, ticker

Data sources / ingestion feeds:
- Capitol Trades style scraping scripts -> normalized into Politician / Issuer / Trade.
- OpenInsider scraping scripts (Playwright-based to bypass anti-bot) -> normalized into OpenInsiderCompany / OpenInsiderOwner / OpenInsiderTransaction.
- Yahoo Finance chart API for historical price fallback:
  - https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
- SEC Form 4 experimental script exists; do not depend on it for core UX.
- Scheduled jobs:
  - Daily newsletter job for paid users.
  - Daily portfolio pre-calculation job generating portfolio cache.

Existing API surface (must integrate with these endpoints):
- Search and suggestions
  - GET /api/search?q=
  - GET /api/suggest/politicians?q=
  - GET /api/suggest/issuers?q=
- Market data / analytics
  - GET /api/price-history/{ticker}?startDate=&endDate=
  - GET /api/yahoo-price/{ticker}?period1=&period2=
  - GET /api/portfolio_comparison/{politician}?start_date=&china_filter=
  - GET /api/insider/latest-date
- User watchlist
  - GET /api/watchlist?type=&politicianId=&companyId=&ownerId=&ticker=
  - POST /api/watchlist
  - DELETE /api/watchlist?type=&politicianId=&companyId=&ownerId=&ticker=
- Auth/account
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/logout-all
  - GET /api/auth/verify
  - POST /api/auth/request-password-reset
  - POST /api/auth/reset-password
  - POST /api/account/change-password
  - GET/POST /api/account/notification-settings
- Billing
  - POST /api/stripe/checkout
  - POST /api/stripe/portal
  - POST /api/stripe/webhook (backend only)

Design + architecture requirements for app integration:
- Mobile-first screen system:
  - Home dashboard
  - Search + results
  - Politician profile + performance chart
  - Issuer profile
  - OpenInsider flow (company/owner/transaction browsing)
  - Watchlist manager
  - Auth screens
  - Account + billing settings
- Define reusable design tokens:
  - color roles, spacing scale, typography, card/list/table patterns, state chips for buy/sell
- Output frontend contract artifacts:
  1) Route map
  2) API client interface (typed request/response shapes)
  3) State model (query cache keys + mutation flows)
  4) Empty/loading/error/unauthorized states for every screen
  5) i18n-ready copy keys (do not hardcode all strings in components)
- Performance constraints:
  - Large lists use pagination/infinite scroll.
  - Chart screens should load quickly with skeleton states.
  - Keep expensive analytics requests isolated and cancellable.
- Backward compatibility:
  - Do not rename backend fields.
  - Add adapter layer in frontend if view model differs.
  - Keep watchlist payload format exactly as backend expects.

Deliverables expected from Base44:
- High-fidelity app UI with component library.
- Clickable user flow prototype.
- Typed API integration map for each screen.
- Handoff notes for implementation in React Native or Next.js app router frontends.
```

## App Integration Blueprint

Use this implementation pattern to keep your new app patchable against the existing system:

- Keep backend endpoints unchanged and build a typed API adapter layer (`/lib/api-client`) in the app.
- Transform raw backend entities into UI view models in one place only (avoid transformation logic inside screens).
- Separate "capital trades" and "openinsider trades" into distinct tabs/data stores to avoid schema confusion.
- Use optimistic updates only for watchlist mutations; everything else should be server-confirmed.
- Feature-gate paid-only UI via `membership_tier` + `membership_expires_at`.
- For chart reliability, try `/api/price-history/{ticker}` first and fallback to `/api/yahoo-price/{ticker}` if empty.

## Minimal API DTO Contract (for frontend generation)

Use these DTOs in your app client layer:

```ts
type MembershipTier = 'FREE' | 'PAID';

type WatchlistType = 'politician' | 'company' | 'owner' | 'stock';

interface SearchResult {
  id: string;
  type: 'politician' | 'issuer' | 'trade';
  title: string;
  subtitle: string;
  url: string;
}

interface PriceHistoryPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

interface PortfolioComparisonResponse {
  dates: string[];
  politician_returns: number[];
  sp500_returns: number[];
  trades: Array<{
    issuer_name: string;
    ticker: string;
    buy_sell: string;
    trade_amount: string;
    filled_date: string;
  }>;
  cached: boolean;
  cached_at?: string;
}

interface WatchlistItem {
  id: string;
  user_id: string;
  watchlist_type: WatchlistType;
  politician_id: string | null;
  company_id: string | null;
  owner_id: string | null;
  ticker: string | null;
  created_at: string;
}
```
