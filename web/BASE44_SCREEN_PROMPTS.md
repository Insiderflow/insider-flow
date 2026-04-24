# Base44 Screen-by-Screen Prompt Pack

Use each prompt separately in Base44 (one screen/module per run) to get cleaner output quality.

---

## 0) Global Design System Prompt (run first)

```text
Create the shared mobile-first design system for "Insider Flow", an insider-trading intelligence app.

Brand/product context:
- Finance + policy intelligence app.
- Users track politician trades and corporate insider transactions.
- Tone: premium, data-dense but readable, fast scan for buy/sell signals.

Design requirements:
- Build color tokens, spacing scale, typography scale, radius/shadows, and semantic colors:
  - positive/buy, negative/sell, warning, neutral, info.
- Components: app header, bottom tab bar, segmented control, chips, badges, cards, stat tiles, list rows, skeletons, toasts, empty states, error states, paywall banner, CTA buttons.
- Define interaction states: default/pressed/disabled/loading.
- Include dark mode and light mode token sets.
- Accessibility: strong contrast, touch targets >=44px, dynamic text scaling.

Output required:
1) Token table
2) Component inventory
3) Usage rules for data-heavy finance UI
4) Mobile layout grid guidance for iOS + Android
```

---

## 1) Home Dashboard Prompt

```text
Design the "Home Dashboard" screen for Insider Flow mobile app.

Goal:
- Give users a quick pulse of latest insider activity and their personalized signals.

Data inputs:
- GET /api/insider/latest-date
- GET /api/watchlist?type=politician
- GET /api/watchlist?type=company
- GET /api/watchlist?type=owner
- GET /api/watchlist?type=stock

UI sections:
1) Top summary strip:
   - latest data date
   - market activity snapshot cards
2) Watchlist activity panel:
   - newest events affecting user watchlist (placeholder card if no events API yet)
3) Quick actions:
   - Search
   - Track Politician
   - Track Stock
4) Premium upsell slot (only for FREE users)

States:
- loading skeleton
- empty watchlist
- error/retry
- unauthorized (prompt login)

Output:
- Pixel-perfect mobile layout
- Component tree with reusable pieces
- Interaction map for CTA buttons
```

---

## 2) Search Prompt

```text
Design the "Search" screen for Insider Flow mobile app.

Goal:
- Unified search for politicians, issuers, and trades with fast suggestions.

Data inputs:
- GET /api/suggest/politicians?q=
- GET /api/suggest/issuers?q=
- GET /api/search?q=

Requirements:
- Search bar with debounce behavior.
- Show suggestion chips before submit.
- Result groups by type: politician, issuer, trade.
- Result row fields:
  - title
  - subtitle
  - type badge
  - destination affordance
- Enable recent searches section (local state).

States:
- idle (empty)
- typing/suggestion
- no results
- API error

Output:
- Search interaction flow
- Result cell variants for each result type
- Navigation mapping from row tap -> target screen
```

---

## 3) Politician Profile + Performance Prompt

```text
Design the "Politician Profile + Performance" screen for Insider Flow mobile app.

Goal:
- Show politician identity, recent trades, and performance vs S&P 500.

Data inputs:
- GET /api/portfolio_comparison/{politician}?start_date=&china_filter=
- GET /api/watchlist?type=politician&politicianId=
- POST /api/watchlist
- DELETE /api/watchlist?type=politician&politicianId=

UI sections:
1) Profile header:
   - name, party, chamber, state
   - watch/unwatch toggle
2) Performance chart:
   - politician_returns vs sp500_returns
   - time range selector
   - "cached" data freshness indicator
3) Trades feed:
   - issuer_name, ticker, buy_sell, trade_amount, filled_date
   - buy/sell visual encoding

States:
- chart loading skeleton
- no trades
- chart API timeout fallback message
- watchlist mutation optimistic state

Output:
- High fidelity layout
- Chart legend/spec
- UX for retry and fallback when analytics request fails
```

---

## 4) Issuer (Company) Profile Prompt

```text
Design the "Issuer Profile" screen for Insider Flow mobile app.

Goal:
- Show company-level insider context and historical price behavior.

Data inputs:
- GET /api/price-history/{ticker}?startDate=&endDate=
- GET /api/yahoo-price/{ticker}?period1=&period2= (fallback)
- GET /api/watchlist?type=stock&ticker=
- POST /api/watchlist
- DELETE /api/watchlist?type=stock&ticker=

UI sections:
1) Issuer header:
   - company name, ticker, sector, country
   - watchlist toggle
2) Price chart:
   - selectable period
   - fallback notice if switched to yahoo source
3) Related insider activity preview list

States:
- no ticker available
- no price history data
- fallback-source active
- unauthorized watchlist action

Output:
- Layout + chart interactions
- Explicit source attribution pattern (internal vs fallback)
```

---

## 5) OpenInsider Explorer Prompt

```text
Design the "OpenInsider Explorer" module for Insider Flow mobile app.

Goal:
- Browse corporate insider transactions by company and owner.

Data model context:
- openinsider_companies
- openinsider_owners
- openinsider_transactions

UI structure:
Tabs:
1) Transactions
2) Companies
3) Owners

Transaction row fields:
- transactionDate, tradeDate, transactionType
- company (ticker + name)
- owner name/title
- value/valueNumeric

Interactions:
- Filter bar (type, date range, ticker keyword)
- Sort controls (date desc default)
- Drill into company or owner detail views
- Watchlist actions for company/owner

States:
- heavy list skeleton
- no matches after filters
- API error with preserved filters

Output:
- Information architecture for 3-tab explorer
- List density options (compact/comfortable)
- Filter UX optimized for mobile
```

---

## 6) Watchlist Manager Prompt

```text
Design the "Watchlist Manager" screen for Insider Flow mobile app.

Goal:
- Unified management of all watchlist types.

Data inputs:
- GET /api/watchlist?type=politician
- GET /api/watchlist?type=company
- GET /api/watchlist?type=owner
- GET /api/watchlist?type=stock
- DELETE /api/watchlist?... (type-specific params)

Requirements:
- Segmented tabs: Politicians / Companies / Owners / Stocks.
- Card/list rows include entity identity + quick remove action.
- Bulk-edit mode (multi-select remove) as optional enhanced UX.
- Empty state CTA should route to Search.

States:
- optimistic remove
- remove failure rollback toast
- empty per tab

Output:
- Core watchlist UX
- Deletion confirmation pattern
- Error recovery interaction spec
```

---

## 7) Authentication Prompt

```text
Design the authentication flow screens for Insider Flow mobile app.

Screens:
1) Login
2) Register
3) Verify email
4) Request password reset
5) Reset password

Data inputs:
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/verify
- POST /api/auth/request-password-reset
- POST /api/auth/reset-password
- POST /api/auth/logout
- POST /api/auth/logout-all

Requirements:
- Strong input validation UI.
- Error messaging for invalid credentials, expired token, unverified email.
- Social login placeholder slot (if enabled later).
- Secure/session-oriented UX language.

Output:
- End-to-end auth journey map
- Form component variants and validation states
- Success/failure states for each endpoint call
```

---

## 8) Account + Notification Settings Prompt

```text
Design "Account & Settings" for Insider Flow mobile app.

Goal:
- Let user manage password, notifications, and account preferences.

Data inputs:
- GET /api/account/notification-settings
- POST /api/account/notification-settings
- POST /api/account/change-password

Sections:
1) Profile summary
2) Notification preferences
3) Security (change password)
4) Session controls (logout all devices)

Requirements:
- Show save/pending/saved states clearly.
- Confirmation messaging for sensitive actions.
- Keep forms concise and mobile-friendly.

Output:
- Detailed settings screen layout
- Toggle and save interaction model
- Error handling matrix by action
```

---

## 9) Billing + Paywall Prompt

```text
Design "Billing, Subscription, and Paywall" UX for Insider Flow mobile app.

Goal:
- Convert FREE users to PAID and help PAID users self-manage billing.

Platform compliance constraint (critical):
- iOS app must use Apple In-App Purchase (StoreKit) for unlocking digital features/content in-app.
- Do not show Stripe checkout purchase flow inside iOS app for digital subscription purchase.
- Stripe checkout can still be used on web.
- iOS app may show "Manage Subscription" that routes to Apple's manage-subscriptions flow for Apple-billed users.
- Only show Stripe customer portal for users billed on web (stripe billing source).

Data inputs:
- iOS purchase state (StoreKit/revenue SDK state): active, trialing, expired, canceled, grace_period
- POST /api/stripe/checkout (web-only upsell entry)
- POST /api/stripe/portal (web-billed users only)
- membership_tier, membership_expires_at, billing_provider (apple|stripe) from user session/profile payload

Requirements:
- Feature comparison block (FREE vs PAID).
- Sticky upgrade CTA for FREE users.
- Current plan card for PAID users.
- "Manage billing" action behavior:
  - billing_provider=apple -> open Apple subscription management instructions/deep link flow
  - billing_provider=stripe -> open Stripe portal flow
- Show membership expiration/renewal state.
- Add paywall copy variants by platform:
  - iOS: compliant IAP copy and in-app purchase button
  - Web: Stripe checkout CTA
- Include restore purchases action for iOS users.

Output:
- Paywall screen
- Plan status component
- Billing settings state model (active, trialing, grace_period, expired, canceled)
- Decision tree for billing CTA rendering by platform + billing_provider
```

---

## 10) Navigation + App Shell Prompt

```text
Design the mobile app shell and navigation for Insider Flow.

Core routes:
- Home
- Search
- Watchlist
- Alerts/Activity (optional placeholder)
- Account

Detail routes:
- Politician profile
- Issuer profile
- OpenInsider company detail
- OpenInsider owner detail

Requirements:
- Bottom tab navigation + stack for detail screens.
- Deep-link friendly route naming.
- Global loading bar/toast system.
- Session-aware route guards for protected screens.

Output:
- Full route map
- Navigation transitions
- Guard logic UX (guest vs authenticated)
```

---

## 11) QA + Handoff Prompt (final run)

```text
Audit all designed Insider Flow screens and generate implementation-ready handoff.

Need:
1) API mapping table per screen:
   - endpoint
   - method
   - request params
   - response fields used in UI
2) Component reuse map:
   - shared components vs one-off components
3) State coverage checklist:
   - loading, empty, error, unauthorized, retry
4) Accessibility checklist
5) Performance checklist for list and chart screens
6) Final "frontend adapter layer" recommendation so backend fields remain unchanged.

Output format:
- concise technical handoff doc suitable for engineering implementation
```

