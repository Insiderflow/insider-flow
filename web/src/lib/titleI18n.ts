type Locale = 'hant' | 'hans' | 'ko';

const MAP: Record<string, { hant: string; hans: string; ko: string }> = {
  'ceo': { hant: '執行長', hans: '首席执行官', ko: 'CEO' },
  'cfo': { hant: '財務長', hans: '首席财务官', ko: 'CFO' },
  'coo': { hant: '營運長', hans: '首席运营官', ko: 'COO' },
  'cto': { hant: '技術長', hans: '首席技术官', ko: 'CTO' },
  'cio': { hant: '資訊長', hans: '信息官', ko: 'CIO' },
  'cmo': { hant: '行銷長', hans: '首席营销官', ko: 'CMO' },
  'chro': { hant: '人資長', hans: '首席人力资源官', ko: 'CHRO' },
  'gc': { hant: '法務長', hans: '总法律顾问', ko: '법무총괄' },
  'general counsel': { hant: '法務長', hans: '总法律顾问', ko: '법무총괄' },
  'president': { hant: '總裁', hans: '总裁', ko: '사장' },
  'pres': { hant: '總裁', hans: '总裁', ko: '사장' },
  'vice president': { hant: '副總裁', hans: '副总裁', ko: '부사장' },
  'vp': { hant: '副總裁', hans: '副总裁', ko: '부사장' },
  'evp': { hant: '資深副總裁', hans: '执行副总裁', ko: '전무' },
  'svp': { hant: '資深副總裁', hans: '高级副总裁', ko: '수석 부사장' },
  'managing director': { hant: '董事總經理', hans: '董事总经理', ko: '상무' },
  'md': { hant: '董事總經理', hans: '董事总经理', ko: '상무' },
  'director': { hant: '董事', hans: '董事', ko: '이사' },
  'independent director': { hant: '獨立董事', hans: '独立董事', ko: '사외이사' },
  'chair': { hant: '董事長', hans: '董事长', ko: '회장' },
  'chairman': { hant: '董事長', hans: '董事长', ko: '회장' },
  'vice chair': { hant: '副董事長', hans: '副董事长', ko: '부회장' },
  'secretary': { hant: '公司秘書', hans: '公司秘书', ko: '회사 서기' },
  'treasurer': { hant: '司庫', hans: '司库', ko: '재무' },
  'controller': { hant: '會計主管', hans: '财务控制官', ko: '회계 책임자' },
  'partner': { hant: '合夥人', hans: '合伙人', ko: '파트너' },
  'principal': { hant: '主要負責人', hans: '负责人', ko: '책임자' },
  'owner': { hant: '擁有者', hans: '所有者', ko: '소유주' },
  '10%': { hant: '10% 持股人', hans: '10% 持股人', ko: '10% 주주' },
  'founder': { hant: '創辦人', hans: '创始人', ko: '창업자' },
  'co-founder': { hant: '共同創辦人', hans: '联合创始人', ko: '공동창업자' },
  'advisor': { hant: '顧問', hans: '顾问', ko: '고문' },
  'consultant': { hant: '顧問', hans: '顾问', ko: '컨설턴트' },
  '10% owner': { hant: '10% 持股人', hans: '10% 持股人', ko: '10% 주주' },
  'chief compliance officer': { hant: '法遵長', hans: '合规总监', ko: '준법감시인' },
  'cco': { hant: '法遵長', hans: '合规总监', ko: '준법감시인' },
  'chief growth officer': { hant: '成長長', hans: '增长官', ko: '성장 책임자' },
  'cgo': { hant: '成長長', hans: '增长官', ko: '성장 책임자' },
  'dir': { hant: '董事', hans: '董事', ko: '이사' },
};

function normalizeSegment(seg: string): string {
  return seg.trim().toLowerCase().replace(/\./g, '').replace(/&/g, ' & ');
}

export function translateTitleAll(title: string | null | undefined): { hant: string; hans: string; ko: string } {
  if (!title) return { hant: '-', hans: '-', ko: '-' };
  // split combos by comma or ampersand
  const parts = title.split(/[,&]/).map(p => normalizeSegment(p)).filter(Boolean);
  if (parts.length === 0) return { hant: title, hans: title, ko: title };

  const mapped = parts.map(p => MAP[p] ?? MAP[p.replace(/\s+/g, ' ')]).filter(Boolean) as Array<{hant:string; hans:string; ko:string}>;

  if (mapped.length > 0) {
    return {
      hant: mapped.map(m => m.hant).join('、'),
      hans: mapped.map(m => m.hans).join('、'),
      ko: mapped.map(m => m.ko).join('、'),
    };
  }

  // fallback: try to expand common abbreviations inside long strings
  const lower = title.toLowerCase();
  for (const key of Object.keys(MAP)) {
    if (lower.includes(key)) {
      return { hant: MAP[key].hant, hans: MAP[key].hans, ko: MAP[key].ko };
    }
  }
  return { hant: title, hans: title, ko: title };
}

export function translateTitle(title: string | null | undefined, locale: Locale = 'hant'): string {
  const all = translateTitleAll(title);
  if (locale === 'hans') return all.hans;
  if (locale === 'ko') return all.ko;
  return all.hant;
}
