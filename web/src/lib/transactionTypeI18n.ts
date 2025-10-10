type Locale = 'hant' | 'hans';

// Maps SEC Form 4 transaction codes (and some common strings) to zh-Hant/zh-Hans
const MAP: Record<string, { hant: string; hans: string }> = {
  'p': { hant: '買入', hans: '买入' },
  'p - purchase': { hant: '買入', hans: '买入' },
  's': { hant: '賣出', hans: '卖出' },
  's - sale': { hant: '賣出', hans: '卖出' },
  'a': { hant: '獎勵/授予', hans: '奖励/授予' },
  'a - award': { hant: '獎勵/授予', hans: '奖励/授予' },
  'd': { hant: '賣回公司/處分', hans: '卖回公司/处分' },
  'g': { hant: '贈與', hans: '赠与' },
  'm': { hant: '轉換', hans: '转换' },
  'f': { hant: '繳稅/行權付款', hans: '缴税/行权付款' },
  'i': { hant: '自由裁量交易', hans: '自由裁量交易' },
  'j': { hant: '其他收購/處分', hans: '其他收购/处分' },
  'k': { hant: '權益轉移', hans: '权益转移' },
  'l': { hant: '小額收購', hans: '小额收购' },
  'n': { hant: '債轉股', hans: '债转股' },
  'o': { hant: '其他', hans: '其他' },
  'w': { hant: '遺囑/信託', hans: '遗嘱/信托' },
  'x': { hant: '行使期權', hans: '行使期权' },
  'z': { hant: '特別事件', hans: '特别事件' },
};

function norm(v: string): string {
  return v.trim().toLowerCase();
}

export function translateTxnType(value: string | null | undefined, locale: Locale = 'hant'): string {
  if (!value) return '-';
  const key = norm(value);
  const direct = MAP[key] || MAP[key.split(' ')[0]]; // try code-only (e.g., 'p')
  if (direct) return locale === 'hans' ? direct.hans : direct.hant;
  return value; // fallback
}





