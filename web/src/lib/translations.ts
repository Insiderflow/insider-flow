export type Language = 'zh-Hant' | 'zh-Hans';

export interface Translations {
  // Navigation
  home: string;
  trades: string;
  politicians: string;
  issuers: string;
  watchlist: string;
  account: string;
  login: string;
  register: string;
  logout: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  apply: string;
  sort: string;
  order: string;
  page: string;
  previous: string;
  next: string;
  
  // Stats
  totalTrades: string;
  politicians: string;
  issuers: string;
  
  // Table headers
  politician: string;
  issuer: string;
  published: string;
  traded: string;
  filedAfter: string;
  owner: string;
  type: string;
  size: string;
  price: string;
  name: string;
  ticker: string;
  trades: string;
  volume: string;
  
  // Account page
  accountSettings: string;
  basicInfo: string;
  email: string;
  emailVerified: string;
  registrationDate: string;
  emailNotifications: string;
  newTradeNotifications: string;
  watchlistUpdates: string;
  weeklyDigest: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  accountActions: string;
  resendVerification: string;
  logoutAllDevices: string;
}

const translations: Record<Language, Translations> = {
  'zh-Hant': {
    // Navigation
    home: '首頁',
    trades: '交易',
    politicians: '政治家',
    issuers: '發行商',
    watchlist: '觀察名單',
    account: '帳戶',
    login: '登入',
    register: '註冊',
    logout: '登出',
    
    // Common
    loading: '載入中...',
    error: '錯誤',
    success: '成功',
    apply: '套用',
    sort: '排序',
    order: '方向',
    page: '頁',
    previous: '上一頁',
    next: '下一頁',
    
    // Stats
    totalTrades: '總交易',
    politicians: '政治家',
    issuers: '發行商',
    
    // Table headers
    politician: '政治家',
    issuer: '發行商',
    published: '發布日期',
    traded: '交易日期',
    filedAfter: '申報延遲',
    owner: '持有人',
    type: '類型',
    size: '金額',
    price: '價格',
    name: '名稱',
    ticker: '代碼',
    trades: '交易次數',
    volume: '交易金額',
    
    // Account page
    accountSettings: '帳戶設定',
    basicInfo: '基本資訊',
    email: '電子郵件',
    emailVerified: '郵件驗證',
    registrationDate: '註冊時間',
    emailNotifications: '郵件通知設定',
    newTradeNotifications: '新交易通知',
    watchlistUpdates: '觀察名單更新',
    weeklyDigest: '週報摘要',
    changePassword: '更改密碼',
    currentPassword: '目前密碼',
    newPassword: '新密碼',
    confirmPassword: '確認新密碼',
    accountActions: '帳戶操作',
    resendVerification: '重新發送驗證郵件',
    logoutAllDevices: '登出所有裝置',
  },
  
  'zh-Hans': {
    // Navigation
    home: '首页',
    trades: '交易',
    politicians: '政治家',
    issuers: '发行商',
    watchlist: '观察名单',
    account: '账户',
    login: '登录',
    register: '注册',
    logout: '登出',
    
    // Common
    loading: '加载中...',
    error: '错误',
    success: '成功',
    apply: '应用',
    sort: '排序',
    order: '方向',
    page: '页',
    previous: '上一页',
    next: '下一页',
    
    // Stats
    totalTrades: '总交易',
    politicians: '政治家',
    issuers: '发行商',
    
    // Table headers
    politician: '政治家',
    issuer: '发行商',
    published: '发布日期',
    traded: '交易日期',
    filedAfter: '申报延迟',
    owner: '持有人',
    type: '类型',
    size: '金额',
    price: '价格',
    name: '名称',
    ticker: '代码',
    trades: '交易次数',
    volume: '交易金额',
    
    // Account page
    accountSettings: '账户设置',
    basicInfo: '基本信息',
    email: '电子邮件',
    emailVerified: '邮件验证',
    registrationDate: '注册时间',
    emailNotifications: '邮件通知设置',
    newTradeNotifications: '新交易通知',
    watchlistUpdates: '观察名单更新',
    weeklyDigest: '周报摘要',
    changePassword: '更改密码',
    currentPassword: '当前密码',
    newPassword: '新密码',
    confirmPassword: '确认新密码',
    accountActions: '账户操作',
    resendVerification: '重新发送验证邮件',
    logoutAllDevices: '登出所有设备',
  },
};

export function getTranslation(key: keyof Translations, language: Language = 'zh-Hant'): string {
  return translations[language][key] || translations['zh-Hant'][key];
}

export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-Hant';
  return (localStorage.getItem('language') as Language) || 'zh-Hant';
}

