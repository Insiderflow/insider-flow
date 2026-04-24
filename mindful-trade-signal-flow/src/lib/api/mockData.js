/**
 * Centralized mock data for all Insider Flow screens.
 * Replace individual exports with real API calls when backend is ready.
 */

export const MOCK_POLITICIAN_TRADES = [
  { id: 'pt1', politician_name: 'Nancy Pelosi', party: 'Democrat', chamber: 'House', state: 'CA', ticker: 'NVDA', company_name: 'NVIDIA Corp', trade_type: 'Buy', amount_range: '$1,001 - $15,000', trade_date: '2026-04-15', disclosure_date: '2026-04-18', sector: 'Technology', committees: 'House Intelligence', notable: true, avatar_url: null },
  { id: 'pt2', politician_name: 'Dan Crenshaw', party: 'Republican', chamber: 'House', state: 'TX', ticker: 'LMT', company_name: 'Lockheed Martin', trade_type: 'Buy', amount_range: '$15,001 - $50,000', trade_date: '2026-04-14', disclosure_date: '2026-04-17', sector: 'Defense', committees: 'Armed Services', notable: false, avatar_url: null },
  { id: 'pt3', politician_name: 'Mitt Romney', party: 'Republican', chamber: 'Senate', state: 'UT', ticker: 'AAPL', company_name: 'Apple Inc', trade_type: 'Sell', amount_range: '$50,001 - $100,000', trade_date: '2026-04-12', disclosure_date: '2026-04-16', sector: 'Technology', committees: 'Finance', notable: false, avatar_url: null },
  { id: 'pt4', politician_name: 'Mark Warner', party: 'Democrat', chamber: 'Senate', state: 'VA', ticker: 'MSFT', company_name: 'Microsoft Corp', trade_type: 'Buy', amount_range: '$1,001 - $15,000', trade_date: '2026-04-10', disclosure_date: '2026-04-14', sector: 'Technology', committees: 'Intelligence', notable: true, avatar_url: null },
  { id: 'pt5', politician_name: 'Tommy Tuberville', party: 'Republican', chamber: 'Senate', state: 'AL', ticker: 'XOM', company_name: 'ExxonMobil', trade_type: 'Buy', amount_range: '$100,001 - $250,000', trade_date: '2026-04-09', disclosure_date: '2026-04-13', sector: 'Energy', committees: 'Armed Services', notable: true, avatar_url: null },
  { id: 'pt6', politician_name: 'Nancy Pelosi', party: 'Democrat', chamber: 'House', state: 'CA', ticker: 'GOOG', company_name: 'Alphabet Inc', trade_type: 'Buy', amount_range: '$250,001 - $500,000', trade_date: '2026-04-08', disclosure_date: '2026-04-11', sector: 'Technology', committees: 'House Intelligence', notable: true, avatar_url: null },
  { id: 'pt7', politician_name: 'Josh Gottheimer', party: 'Democrat', chamber: 'House', state: 'NJ', ticker: 'AMZN', company_name: 'Amazon.com', trade_type: 'Sell', amount_range: '$15,001 - $50,000', trade_date: '2026-04-07', disclosure_date: '2026-04-10', sector: 'Consumer', committees: 'Financial Services', notable: false, avatar_url: null },
  { id: 'pt8', politician_name: 'Pat Toomey', party: 'Republican', chamber: 'Senate', state: 'PA', ticker: 'JPM', company_name: 'JPMorgan Chase', trade_type: 'Buy', amount_range: '$1,001 - $15,000', trade_date: '2026-04-06', disclosure_date: '2026-04-09', sector: 'Finance', committees: 'Banking', notable: false, avatar_url: null },
];

export const MOCK_CORPORATE_TRADES = [
  { id: 'ct1', insider_name: 'Jensen Huang', title: 'CEO', ticker: 'NVDA', company_name: 'NVIDIA Corp', trade_type: 'Sell', shares: 120000, price_per_share: 875.5, total_value: 105060000, trade_date: '2026-04-15', filing_date: '2026-04-16', sector: 'Technology', ownership_change_pct: -2.1, notable: true },
  { id: 'ct2', insider_name: 'Tim Cook', title: 'CEO', ticker: 'AAPL', company_name: 'Apple Inc', trade_type: 'Sell', shares: 511000, price_per_share: 178.9, total_value: 91417900, trade_date: '2026-04-14', filing_date: '2026-04-15', sector: 'Technology', ownership_change_pct: -1.8, notable: true },
  { id: 'ct3', insider_name: 'Satya Nadella', title: 'CEO', ticker: 'MSFT', company_name: 'Microsoft Corp', trade_type: 'Sell', shares: 75000, price_per_share: 412.3, total_value: 30922500, trade_date: '2026-04-13', filing_date: '2026-04-14', sector: 'Technology', ownership_change_pct: -0.9, notable: false },
  { id: 'ct4', insider_name: 'Elon Musk', title: 'Director', ticker: 'TSLA', company_name: 'Tesla Inc', trade_type: 'Sell', shares: 2500000, price_per_share: 234.1, total_value: 585250000, trade_date: '2026-04-11', filing_date: '2026-04-12', sector: 'Consumer', ownership_change_pct: -3.4, notable: true },
  { id: 'ct5', insider_name: 'Andy Jassy', title: 'CEO', ticker: 'AMZN', company_name: 'Amazon.com', trade_type: 'Buy', shares: 10000, price_per_share: 188.5, total_value: 1885000, trade_date: '2026-04-10', filing_date: '2026-04-11', sector: 'Consumer', ownership_change_pct: 0.4, notable: false },
  { id: 'ct6', insider_name: 'Jamie Dimon', title: 'CEO', ticker: 'JPM', company_name: 'JPMorgan Chase', trade_type: 'Buy', shares: 25000, price_per_share: 198.7, total_value: 4967500, trade_date: '2026-04-09', filing_date: '2026-04-10', sector: 'Finance', ownership_change_pct: 0.8, notable: true },
  { id: 'ct7', insider_name: 'Lisa Su', title: 'CEO', ticker: 'AMD', company_name: 'Advanced Micro Devices', trade_type: 'Sell', shares: 40000, price_per_share: 162.4, total_value: 6496000, trade_date: '2026-04-08', filing_date: '2026-04-09', sector: 'Technology', ownership_change_pct: -0.6, notable: false },
  { id: 'ct8', insider_name: 'Mark Zuckerberg', title: 'CEO', ticker: 'META', company_name: 'Meta Platforms', trade_type: 'Sell', shares: 180000, price_per_share: 527.8, total_value: 95004000, trade_date: '2026-04-07', filing_date: '2026-04-08', sector: 'Technology', ownership_change_pct: -0.3, notable: true },
];

export const MOCK_OPEN_INSIDER_TRANSACTIONS = [
  { id: 'ot1', transaction_date: '2026-04-15', trade_date: '2026-04-14', transaction_type: 'P - Purchase', ticker: 'NVDA', company_name: 'NVIDIA Corp', owner_name: 'Jensen Huang', owner_title: 'CEO', shares: 5000, price: 875.5, value: '$4.4M', value_numeric: 4377500, sector: 'Technology', notable: true },
  { id: 'ot2', transaction_date: '2026-04-14', trade_date: '2026-04-13', transaction_type: 'S - Sale', ticker: 'AAPL', company_name: 'Apple Inc', owner_name: 'Tim Cook', owner_title: 'CEO', shares: 511000, price: 178.9, value: '$91.4M', value_numeric: 91417900, sector: 'Technology', notable: true },
  { id: 'ot3', transaction_date: '2026-04-13', trade_date: '2026-04-12', transaction_type: 'P - Purchase', ticker: 'JPM', company_name: 'JPMorgan Chase', owner_name: 'Jamie Dimon', owner_title: 'CEO', shares: 25000, price: 198.7, value: '$5.0M', value_numeric: 4967500, sector: 'Finance', notable: true },
  { id: 'ot4', transaction_date: '2026-04-12', trade_date: '2026-04-11', transaction_type: 'S - Sale', ticker: 'TSLA', company_name: 'Tesla Inc', owner_name: 'Elon Musk', owner_title: 'Director', shares: 2500000, price: 234.1, value: '$585.3M', value_numeric: 585250000, sector: 'Consumer', notable: true },
  { id: 'ot5', transaction_date: '2026-04-11', trade_date: '2026-04-10', transaction_type: 'P - Purchase', ticker: 'AMZN', company_name: 'Amazon.com', owner_name: 'Andy Jassy', owner_title: 'CEO', shares: 10000, price: 188.5, value: '$1.9M', value_numeric: 1885000, sector: 'Consumer', notable: false },
  { id: 'ot6', transaction_date: '2026-04-10', trade_date: '2026-04-09', transaction_type: 'S - Sale', ticker: 'META', company_name: 'Meta Platforms', owner_name: 'Mark Zuckerberg', owner_title: 'CEO', shares: 180000, price: 527.8, value: '$95.0M', value_numeric: 95004000, sector: 'Technology', notable: true },
  { id: 'ot7', transaction_date: '2026-04-09', trade_date: '2026-04-08', transaction_type: 'S - Sale', ticker: 'AMD', company_name: 'Advanced Micro Devices', owner_name: 'Lisa Su', owner_title: 'CEO', shares: 40000, price: 162.4, value: '$6.5M', value_numeric: 6496000, sector: 'Technology', notable: false },
  { id: 'ot8', transaction_date: '2026-04-08', trade_date: '2026-04-07', transaction_type: 'P - Purchase', ticker: 'XOM', company_name: 'ExxonMobil', owner_name: 'Darren Woods', owner_title: 'CEO', shares: 15000, price: 121.3, value: '$1.8M', value_numeric: 1819500, sector: 'Energy', notable: false },
];

export const MOCK_OI_COMPANIES = [
  { id: 'oc1', ticker: 'NVDA', company_name: 'NVIDIA Corp', sector: 'Technology', country: 'US', trade_count: 47, last_trade_date: '2026-04-15' },
  { id: 'oc2', ticker: 'AAPL', company_name: 'Apple Inc', sector: 'Technology', country: 'US', trade_count: 38, last_trade_date: '2026-04-14' },
  { id: 'oc3', ticker: 'TSLA', company_name: 'Tesla Inc', sector: 'Consumer', country: 'US', trade_count: 34, last_trade_date: '2026-04-11' },
  { id: 'oc4', ticker: 'META', company_name: 'Meta Platforms', sector: 'Technology', country: 'US', trade_count: 29, last_trade_date: '2026-04-10' },
  { id: 'oc5', ticker: 'JPM', company_name: 'JPMorgan Chase', sector: 'Finance', country: 'US', trade_count: 22, last_trade_date: '2026-04-13' },
  { id: 'oc6', ticker: 'AMZN', company_name: 'Amazon.com', sector: 'Consumer', country: 'US', trade_count: 19, last_trade_date: '2026-04-11' },
  { id: 'oc7', ticker: 'MSFT', company_name: 'Microsoft Corp', sector: 'Technology', country: 'US', trade_count: 17, last_trade_date: '2026-04-13' },
  { id: 'oc8', ticker: 'XOM', company_name: 'ExxonMobil', sector: 'Energy', country: 'US', trade_count: 14, last_trade_date: '2026-04-08' },
];

export const MOCK_OI_OWNERS = [
  { id: 'oo1', owner_name: 'Jensen Huang', owner_title: 'CEO', company_name: 'NVIDIA Corp', ticker: 'NVDA', trade_count: 12, last_trade_date: '2026-04-15' },
  { id: 'oo2', owner_name: 'Tim Cook', owner_title: 'CEO', company_name: 'Apple Inc', ticker: 'AAPL', trade_count: 9, last_trade_date: '2026-04-14' },
  { id: 'oo3', owner_name: 'Elon Musk', owner_title: 'Director', company_name: 'Tesla Inc', ticker: 'TSLA', trade_count: 21, last_trade_date: '2026-04-11' },
  { id: 'oo4', owner_name: 'Mark Zuckerberg', owner_title: 'CEO', company_name: 'Meta Platforms', ticker: 'META', trade_count: 7, last_trade_date: '2026-04-10' },
  { id: 'oo5', owner_name: 'Jamie Dimon', owner_title: 'CEO', company_name: 'JPMorgan Chase', ticker: 'JPM', trade_count: 5, last_trade_date: '2026-04-13' },
  { id: 'oo6', owner_name: 'Andy Jassy', owner_title: 'CEO', company_name: 'Amazon.com', ticker: 'AMZN', trade_count: 4, last_trade_date: '2026-04-11' },
  { id: 'oo7', owner_name: 'Lisa Su', owner_title: 'CEO', company_name: 'AMD', ticker: 'AMD', trade_count: 8, last_trade_date: '2026-04-08' },
  { id: 'oo8', owner_name: 'Satya Nadella', owner_title: 'CEO', company_name: 'Microsoft Corp', ticker: 'MSFT', trade_count: 6, last_trade_date: '2026-04-13' },
];

export const MOCK_DASHBOARD_STATS = {
  buysToday: 47,
  sellsToday: 83,
  activeTraders: 31,
  buysDelta: '+12 vs yesterday',
  sellsDelta: '+5 vs yesterday',
  activeDelta: 'this week',
};

export const MOCK_ALERTS = [
  { id: 'al1', type: 'notable_trade', title: 'Notable Buy: NVDA', body: 'Jensen Huang purchased $4.4M of NVIDIA stock.', timestamp: '2026-04-15T14:32:00Z', read: false, ticker: 'NVDA' },
  { id: 'al2', type: 'politician', title: 'Nancy Pelosi: New Trade', body: 'Pelosi disclosed a buy in GOOG worth $250K+.', timestamp: '2026-04-14T09:15:00Z', read: false, ticker: 'GOOG' },
  { id: 'al3', type: 'watchlist', title: 'Watchlist: TSLA Activity', body: 'Elon Musk sold $585M of Tesla stock — flagged as notable.', timestamp: '2026-04-13T16:48:00Z', read: true, ticker: 'TSLA' },
  { id: 'al4', type: 'corporate', title: 'CEO Sell: META', body: 'Mark Zuckerberg sold $95M of Meta shares.', timestamp: '2026-04-12T11:22:00Z', read: true, ticker: 'META' },
  { id: 'al5', type: 'notable_trade', title: 'Notable Buy: JPM', body: 'Jamie Dimon purchased $5M in JPMorgan Chase.', timestamp: '2026-04-11T08:00:00Z', read: true, ticker: 'JPM' },
];