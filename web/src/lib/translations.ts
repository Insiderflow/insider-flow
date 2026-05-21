export type Language = 'zh-Hant' | 'zh-Hans' | 'ko';

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

  // Search
  searchPlaceholder: string;
  searchPoliticianNamePlaceholder: string;
  searchIssuerQueryPlaceholder: string;
  searchCompanyPlaceholder: string;
  searchOwnerPlaceholder: string;
  searchNoResults: string;
  searchTryOther: string;
  searchResultDefault: string;
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
    searchPlaceholder: '搜尋政治家、發行商或交易...',
    searchPoliticianNamePlaceholder: '輸入議員姓名…',
    searchIssuerQueryPlaceholder: '公司名稱或股票代號…',
    searchCompanyPlaceholder: '搜尋公司...',
    searchOwnerPlaceholder: '搜尋交易者...',
    searchNoResults: '找不到相關結果',
    searchTryOther: '試試其他關鍵字',
    searchResultDefault: '結果',
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
    searchPlaceholder: '搜索政治家、发行商或交易...',
    searchPoliticianNamePlaceholder: '输入议员姓名…',
    searchIssuerQueryPlaceholder: '公司名称或股票代号…',
    searchCompanyPlaceholder: '搜索公司...',
    searchOwnerPlaceholder: '搜索交易者...',
    searchNoResults: '找不到相关结果',
    searchTryOther: '试试其他关键字',
    searchResultDefault: '结果',
  },

  ko: {
    home: '홈',
    trades: '거래',
    politicians: '의원',
    issuers: '발행사',
    watchlist: '관심목록',
    account: '계정',
    login: '로그인',
    register: '회원가입',
    logout: '로그아웃',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    apply: '적용',
    sort: '정렬',
    order: '순서',
    page: '페이지',
    previous: '이전',
    next: '다음',
    totalTrades: '총 거래',
    politician: '의원',
    issuer: '발행사',
    published: '공시일',
    traded: '거래일',
    filedAfter: '신고 지연',
    owner: '보유자',
    type: '유형',
    size: '금액',
    price: '가격',
    name: '이름',
    ticker: '티커',
    volume: '거래 금액',
    accountSettings: '계정 설정',
    basicInfo: '기본 정보',
    email: '이메일',
    emailVerified: '이메일 인증',
    registrationDate: '가입일',
    emailNotifications: '이메일 알림 설정',
    newTradeNotifications: '신규 거래 알림',
    watchlistUpdates: '관심목록 업데이트',
    weeklyDigest: '주간 요약',
    changePassword: '비밀번호 변경',
    currentPassword: '현재 비밀번호',
    newPassword: '새 비밀번호',
    confirmPassword: '비밀번호 확인',
    accountActions: '계정 작업',
    resendVerification: '인증 메일 재전송',
    logoutAllDevices: '모든 기기에서 로그아웃',
    searchPlaceholder: '의원, 발행사 또는 거래 검색...',
    searchPoliticianNamePlaceholder: '의원 이름 입력…',
    searchIssuerQueryPlaceholder: '회사명 또는 티커…',
    searchCompanyPlaceholder: '회사 검색...',
    searchOwnerPlaceholder: '내부자 검색...',
    searchNoResults: '검색 결과 없음',
    searchTryOther: '다른 키워드를 입력해 보세요',
    searchResultDefault: '결과',
  },
};

export function getTranslation(key: keyof Translations, language: Language = 'zh-Hant'): string {
  return translations[language][key] || translations['zh-Hant'][key];
}

export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-Hant';
  try {
    const value = localStorage.getItem('language');
    if (value === 'zh-Hans' || value === 'ko') return value;
    return 'zh-Hant';
  } catch {
    return 'zh-Hant';
  }
}

