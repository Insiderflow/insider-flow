type Locale = 'hant' | 'hans' | 'ko';

// Maps SEC Form 4 transaction codes (and some common strings) to zh-Hant/zh-Hans/ko
const MAP: Record<string, { hant: string; hans: string; ko: string }> = {
  'p': { hant: '買入', hans: '买入', ko: '매수' },
  'p - purchase': { hant: '買入', hans: '买入', ko: '매수' },
  's': { hant: '賣出', hans: '卖出', ko: '매도' },
  's - sale': { hant: '賣出', hans: '卖出', ko: '매도' },
  'a': { hant: '獎勵/授予', hans: '奖励/授予', ko: '보상/부여' },
  'a - award': { hant: '獎勵/授予', hans: '奖励/授予', ko: '보상/부여' },
  'd': { hant: '賣回公司/處分', hans: '卖回公司/处分', ko: '회사 매각/처분' },
  'g': { hant: '贈與', hans: '赠与', ko: '증여' },
  'm': { hant: '轉換', hans: '转换', ko: '전환' },
  'f': { hant: '繳稅/行權付款', hans: '缴税/行权付款', ko: '세금/행사 대금' },
  'i': { hant: '自由裁量交易', hans: '自由裁量交易', ko: '재량 거래' },
  'j': { hant: '其他收購/處分', hans: '其他收购/处分', ko: '기타 취득/처분' },
  'k': { hant: '權益轉移', hans: '权益转移', ko: '지분 이전' },
  'l': { hant: '小額收購', hans: '小额收购', ko: '소액 취득' },
  'n': { hant: '債轉股', hans: '债转股', ko: '채무→주식 전환' },
  'o': { hant: '其他', hans: '其他', ko: '기타' },
  'w': { hant: '遺囑/信託', hans: '遗嘱/信托', ko: '유언/신탁' },
  'x': { hant: '行使期權', hans: '行使期权', ko: '스톡옵션 행사' },
  'z': { hant: '特別事件', hans: '特别事件', ko: '특별 이벤트' },
};

function norm(v: string): string {
  return v.trim().toLowerCase();
}

export function translateTxnType(value: string | null | undefined, locale: Locale = 'hant'): string {
  if (!value) return '-';
  const key = norm(value);
  const direct = MAP[key] || MAP[key.split(' ')[0]]; // try code-only (e.g., 'p')
  if (direct) {
    if (locale === 'hans') return direct.hans;
    if (locale === 'ko') return direct.ko;
    return direct.hant;
  }
  return value; // fallback
}
