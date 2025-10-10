type Locale = 'hant' | 'hans';

const MAP: Record<string, { hant: string; hans: string }> = {
  'ceo': { hant: '執行長', hans: '首席执行官' },
  'cfo': { hant: '財務長', hans: '首席财务官' },
  'coo': { hant: '營運長', hans: '首席运营官' },
  'cto': { hant: '技術長', hans: '首席技术官' },
  'cio': { hant: '資訊長', hans: '信息官' },
  'cmo': { hant: '行銷長', hans: '首席营销官' },
  'chro': { hant: '人資長', hans: '首席人力资源官' },
  'gc': { hant: '法務長', hans: '总法律顾问' },
  'general counsel': { hant: '法務長', hans: '总法律顾问' },
  'president': { hant: '總裁', hans: '总裁' },
  'pres': { hant: '總裁', hans: '总裁' },
  'vice president': { hant: '副總裁', hans: '副总裁' },
  'vp': { hant: '副總裁', hans: '副总裁' },
  'evp': { hant: '資深副總裁', hans: '执行副总裁' },
  'svp': { hant: '資深副總裁', hans: '高级副总裁' },
  'managing director': { hant: '董事總經理', hans: '董事总经理' },
  'md': { hant: '董事總經理', hans: '董事总经理' },
  'director': { hant: '董事', hans: '董事' },
  'independent director': { hant: '獨立董事', hans: '独立董事' },
  'chair': { hant: '董事長', hans: '董事长' },
  'chairman': { hant: '董事長', hans: '董事长' },
  'vice chair': { hant: '副董事長', hans: '副董事长' },
  'secretary': { hant: '公司秘書', hans: '公司秘书' },
  'treasurer': { hant: '司庫', hans: '司库' },
  'controller': { hant: '會計主管', hans: '财务控制官' },
  'partner': { hant: '合夥人', hans: '合伙人' },
  'principal': { hant: '主要負責人', hans: '负责人' },
  'owner': { hant: '擁有者', hans: '所有者' },
  '10%': { hant: '10% 持股人', hans: '10% 持股人' },
  'founder': { hant: '創辦人', hans: '创始人' },
  'co-founder': { hant: '共同創辦人', hans: '联合创始人' },
  'advisor': { hant: '顧問', hans: '顾问' },
  'consultant': { hant: '顧問', hans: '顾问' },
  '10% owner': { hant: '10% 持股人', hans: '10% 持股人' },
  'chief compliance officer': { hant: '法遵長', hans: '合规总监' },
  'cco': { hant: '法遵長', hans: '合规总监' },
  'chief growth officer': { hant: '成長長', hans: '增长官' },
  'cgo': { hant: '成長長', hans: '增长官' },
  'dir': { hant: '董事', hans: '董事' },
};

function normalizeSegment(seg: string): string {
  return seg.trim().toLowerCase().replace(/\./g, '').replace(/&/g, ' & ');
}

export function translateTitleAll(title: string | null | undefined): { hant: string; hans: string } {
  if (!title) return { hant: '-', hans: '-' };
  // split combos by comma or ampersand
  const parts = title.split(/[,&]/).map(p => normalizeSegment(p)).filter(Boolean);
  if (parts.length === 0) return { hant: title, hans: title };

  const mapped = parts.map(p => MAP[p] ?? MAP[p.replace(/\s+/g, ' ')]).filter(Boolean) as Array<{hant:string; hans:string}>;

  if (mapped.length > 0) {
    return {
      hant: mapped.map(m => m.hant).join('、'),
      hans: mapped.map(m => m.hans).join('、'),
    };
  }

  // fallback: try to expand common abbreviations inside long strings
  const lower = title.toLowerCase();
  for (const key of Object.keys(MAP)) {
    if (lower.includes(key)) {
      return { hant: MAP[key].hant, hans: MAP[key].hans };
    }
  }
  return { hant: title, hans: title };
}

export function translateTitle(title: string | null | undefined, locale: Locale = 'hant'): string {
  const all = translateTitleAll(title);
  return locale === 'hans' ? all.hans : all.hant;
}


