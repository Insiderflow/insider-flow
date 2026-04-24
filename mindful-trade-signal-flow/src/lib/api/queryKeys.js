/**
 * Centralized TanStack Query cache keys.
 * Use these everywhere — never inline strings.
 */
export const QUERY_KEYS = {
  dashboardStats:          ['dashboard-stats'],
  politicianTrades:        ['politician-trades'],
  corporateTrades:         ['corporate-trades'],
  politicianProfile:       (name) => ['politician-profile', name],
  issuerTrades:            (ticker) => ['issuer-trades', ticker],
  openInsiderTransactions: ['oi-transactions'],
  openInsiderCompanies:    ['oi-companies'],
  openInsiderOwners:       ['oi-owners'],
  watchlist:               ['watchlist'],
  searchAll:               ['search-all-trades'],
  alerts:                  ['alerts'],
  alertsUnreadCount:       ['alerts-unread-count'],
};