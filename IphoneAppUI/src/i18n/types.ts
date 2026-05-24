export type Locale = "zh-Hant" | "zh-Hans" | "ko";

export interface Messages {
  lang: {
    traditional: string;
    simplified: string;
    korean: string;
    switchAria: string;
  };
  dataMode: {
    politician: string;
    insider: string;
    switchAria: string;
    signalsLinkAria: string;
  };
  header: {
    title: string;
    dataAsOf: string;
    updatesAt: string;
  };
  period: { aria: string };
  pullRefresh: { hint: string; refreshing: string };
  sections: {
    overview: string;
    clusterBuy: string;
    clusterSell: string;
    politicianBuy: string;
    politicianSale: string;
    insiderBuy: string;
    insiderSale: string;
    industryTrends: string;
  };
  aiSummary: { title: string; collapse: string; expand: string };
  dashboardAi: {
    headline: (buys: number, sells: number, period: string) => string;
    buysToday: (count: number) => string;
    buysTodayNone: string;
    sectorLeads: (sector: string) => string;
    sectorMixed: string;
  };
  sentiment: { bullish: string; bearish: string; mixed: string };
  kpi: {
    buys: string;
    sells: string;
    options: string;
    ppSale: string;
    plan10b5: string;
    todayChange: string;
  };
  cluster: {
    insiders: string;
    insidersCorporate: string;
    trades: string;
  };
  sectors: {
    "Information Technology": string;
    Financials: string;
    Industrials: string;
    "Health Care": string;
    "Consumer Discretionary": string;
    "Communication Services": string;
    "Consumer Staples": string;
    Energy: string;
    Materials: string;
    "Real Estate": string;
    Utilities: string;
    Other: string;
  };
  tradeFlags: {
    notable_size: string;
    committee_sector: string;
    congress_cluster: string;
    insider_cluster: string;
    filterOnly: string;
    filterOff: string;
  };
  committeeSector: {
    title: string;
    subtitle: (period: string) => string;
    explainer: string;
    alignedPct: (pct: number) => string;
    rowMeta: (count: number, buy: number, sell: number) => string;
  };
  discover: {
    hint: string;
    empty: string;
    activePoliticians: string;
    activeTickers: string;
    recentFlagged: string;
    politicianMeta: (count: number, volume: number) => string;
    tickerMeta: (count: number, volume: number) => string;
  };
  trade: {
    buy: string;
    sell: string;
    proposedSale: string;
    proposedShort: string;
    rep: string;
    sen: string;
    officer: string;
    cfo: string;
    director: string;
    ceo: string;
    approxAmount: string;
    publishedAt: string;
    tradedAt: string;
  };
  industry: {
    primeBrokerFlow: string;
    industryChain: string;
    topIndustries: string;
    buyPct: string;
    sellPct: string;
  };
  industryChainPage: {
    back: string;
    empty: string;
    industryCount: (count: number, period: string) => string;
  };
  primeBrokerPage: {
    back: string;
    empty: string;
    topIndustries: string;
    industryCount: (count: number, period: string) => string;
    cardIndustries: (count: number) => string;
    rowMeta: (amount: string, trades: number, pct: number) => string;
  };
  industryComparePage: {
    back: string;
    title: string;
    empty: string;
    noCompanies: string;
    companyMeta: (amount: string, trades: number, insiders: number) => string;
  };
  recentTrades: {
    title: string;
    filingsToday: (n: number) => string;
    showMore: (n: number) => string;
  };
  todaysTrades: {
    count: (n: number) => string;
    empty: string;
    etNote: string;
  };
  tabs: {
    dashboard: string;
    live: string;
    signals: string;
    search: string;
    settings: string;
  };
  signalsPage: {
    title: string;
    subtitle: string;
    empty: string;
    loadError: string;
    periodLabel: string;
    feedAria: string;
    feed: { all: string; politician: string; corporate: string };
    feedBadge: { politician: string; corporate: string };
    tierAria: string;
    tier: { all: string; medium_plus: string; high: string };
    sideAria: string;
    side: { buy: string; sell: string; hold: string };
    recommendation: { buy: string; sell: string; hold: string };
    recommendationAria: (r: "buy" | "sell" | "hold") => string;
    tradeSide: { buy: string; sell: string; proposed_sale: string };
    filingLabel: (side: string) => string;
    sideFilter: { all: string; buy: string; sell: string; hold: string };
    headline: (flags: string[], ticker: string, name: string) => string;
    insiderHeadline: (flags: string[], ticker: string, name: string) => string;
    mlScore: (score: number) => string;
    mlTier: { high: string; medium: string; low: string };
    mlReason: Record<
      | 'unusual_size'
      | 'congress_cluster'
      | 'committee_sector'
      | 'notable_size'
      | 'recent_filing'
      | 'late_disclosure',
      string
    >;
  };
  signalDetail: {
    title: string;
    back: string;
    notFound: string;
    whyFlagged: string;
    criteriaCol: string;
    detailCol: string;
    disclaimer: string;
    hitCount: (met: number, total: number) => string;
    showUnmet: string;
    hideUnmet: string;
    scoreTitle: string;
    scoreBreakdown: {
      flags: string;
      size: string;
      cluster: string;
      recency: string;
      late: string;
    };
    insight: (args: {
      name: string;
      side: string;
      ticker: string;
      amount: string;
      percentile: number;
      daysAgo: number;
    }) => string;
    tickerContextCongress: (args: {
      count: number;
      ticker: string;
      side: string;
      days: number;
    }) => string;
    tickerContextCorporate: (args: {
      count: number;
      ticker: string;
      side: string;
      days: number;
    }) => string;
    links: string;
    viewPolitician: string;
    viewInsider: string;
    viewCompany: string;
    criteria: Record<
      | 'notable_size'
      | 'committee_sector'
      | 'congress_cluster'
      | 'insider_cluster'
      | 'unusual_size'
      | 'recent_filing'
      | 'late_disclosure',
      string
    >;
  };
  portfolioPage: {
    title: string;
    subtitle: string;
    paperDisclaimer: string;
    empty: string;
    createFlagged: string;
    createPolitician: string;
    rebuild: string;
    delete: string;
    weight: (pct: number) => string;
    lastBuilt: (date: string) => string;
    limitReached: string;
    pickPolitician: string;
    presetFlagged7d: string;
    presetFlagged30d: string;
    politicianMirror: string;
  };
  live: {
    pageTitle: string;
    subTabLive: string;
    subTabHistory: string;
    searchPlaceholder: string;
    filterAria: string;
    marketClosed: string;
    marketOpen: string;
    etTime: (time: string) => string;
    filed: string;
    price: string;
    totalValue: string;
    holdings: string;
    outstanding: string;
    disclosureType: string;
    disclosureRsu: string;
    searchPlaceholderInsider: string;
    empty: string;
    searching: string;
    infoAria: string;
  };
  mock: {
    meta: { dataAsOf: string; nextUpdateEt: string };
    aiSummary: {
      headline: string;
      narrative?: string;
      bullets: string[];
    };
    clusters: Record<
      string,
      { title: string; subtitle: string }
    >;
    industries: Record<string, string>;
    filedAt: Record<string, string>;
  };
  mockInsider: {
    aiSummary: {
      headline: string;
      narrative?: string;
      bullets: string[];
    };
    clusters: Record<string, { title: string; subtitle: string }>;
  };
  insiderProfile: {
    back: string;
    overview: string;
    trades: string;
    companies: string;
    insiders: string;
    notifications: string;
    aiAvailableNote: string;
    asOf: (date: string) => string;
    recentTrades: string;
    viewAllTrades: (n: number) => string;
    eventStudies: string;
    liveActivity: string;
    liveActivitySub: string;
    totalBuys: string;
    totalSells: string;
    totalOptions: string;
    totalProposedSale: string;
    transactions: string;
    avgBuy: string;
    avgSell: string;
    plan10b5: string;
    ppSale: string;
    buyRange: string;
    sellRange: string;
    tradeTypes: string;
    companyInfo: string;
    readMore: string;
    readLess: string;
    topClusterBuy: string;
    topClusterSale: string;
    topInsiderBuy: string;
    topInsiderSale: string;
    topIndustries: string;
    topBuyTab: string;
    topSellTab: string;
    industryChainLegendBuy: string;
    industryChainLegendSell: string;
    industryChainLegendMixed: string;
    industriesCount: (n: number) => string;
    buysOf: (buys: number, total: number) => string;
    sellsOf: (sells: number, total: number) => string;
  };
  politicianProfile: {
    tradeCount: string;
    issuerCount: string;
    totalVolume: string;
    maxTrade: string;
    lastTrade: string;
    topIssuers: string;
    buyVolume: string;
    sellVolume: string;
    sp500: string;
    trendTitle: (name: string) => string;
    noChartData: string;
    tradesUnit: string;
  };
  issuerProfile: {
    politicians: string;
    topPoliticians: string;
    recentTrades: string;
    politicianTrades: (n: number) => string;
  };
  watchlist: {
    add: string;
    watching: string;
    trackPolitician: string;
    trackStock: string;
    trackInsider: string;
    signInToAdd: string;
    processing: string;
    error: string;
  };
  watchlistPage: {
    back: string;
    title: string;
    subtitle: string;
    empty: string;
    remove: string;
    removeConfirm: (name: string) => string;
    tabs: {
      all: string;
      politician: string;
      company: string;
      owner: string;
      stock: string;
    };
  };
  notificationSettingsPage: {
    back: string;
    title: string;
    subtitle: string;
    saved: string;
    saveFailed: string;
    emailNote: string;
    newTrades: { title: string; description: string };
    watchlistUpdates: { title: string; description: string };
    weeklyDigest: { title: string; description: string };
  };
  legal: {
    back: string;
    notFound: string;
    lastUpdated: (date: string) => string;
    alsoSee: string;
    termsTitle: string;
    privacyTitle: string;
  };
  settings: {
    premium: string;
    manageSubscription: string;
    notifications: string;
    notificationPrefs: string;
    followedCompanies: string;
    subscription: string;
    restorePurchases: string;
    about: string;
    terms: string;
    privacy: string;
    rateApp: string;
    language: string;
    account: string;
    signOut: string;
    deleteAccount: string;
    version: (version: string, build: string) => string;
    languageSheetTitle: string;
    comingSoon: string;
    signOutConfirm: string;
    deleteConfirm: string;
    signInRequired: string;
    upgradeToPro: string;
    referencePortfolio: string;
    viewDesktopSite: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    name: string;
    namePlaceholder: string;
    email: string;
    password: string;
    confirmPassword: string;
    signIn: string;
    signingIn: string;
    signUp: string;
    signingUp: string;
    loginFailed: string;
    registerFailed: string;
    passwordTooShort: string;
    passwordMismatch: string;
    emailExists: string;
    verifyEmailSent: string;
    switchToRegister: string;
    switchToLogin: string;
    termsHint: string;
    registerTermsHint: string;
  };
  subscription: {
    title: string;
    membershipStatus: string;
    tierFree: string;
    tierPaid: string;
    renewsOn: (date: string) => string;
    statusLabel: (status: string) => string;
    billingVia: (provider: string) => string;
    manageTitle: string;
    manageSubtitle: string;
    openPortal: string;
    openingPortal: string;
    upgradeTitle: string;
    upgradeSubtitle: string;
    startSubscription: string;
    successMessage: string;
    canceledMessage: string;
    stripeHint: string;
    portalNoSubscription: string;
    portalInvalidCustomer: string;
    portalPaymentConfig: string;
    portalFailed: string;
  };
  paywall: {
    title: string;
    headline: string;
    subtitle: string;
    monthlyPlan: string;
    yearlyPlan: string;
    priceMonthly: string;
    priceYearly: string;
    perMonth: string;
    perYear: string;
    yearlyBadge: string;
    yearlySavings: string;
    ctaMonthly: string;
    ctaYearly: string;
    paidCol: string;
    featureCol: string;
    freeCol: string;
    processing: string;
    restoring: string;
    checkoutFailed: string;
    restoreFailed: string;
    priceNotConfigured: string;
    stripeNote: string;
    features: Array<{ label: string; free: boolean }>;
  };
}
