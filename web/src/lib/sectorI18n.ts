const sectorZhMap: Record<string, string> = {
  CommunicationServices: '通訊服務',
  ConsumerDiscretionary: '非必需消費',
  ConsumerStaples: '必需消費',
  Energy: '能源',
  FinancialServices: '金融服務',
  Financials: '金融',
  Healthcare: '醫療保健',
  HealthCare: '醫療保健',
  Industrials: '工業',
  BasicMaterials: '基礎材料',
  Materials: '原材料',
  RealEstate: '房地產',
  Technology: '科技',
  InformationTechnology: '資訊科技',
  InformationTech: '資訊科技',
  Utilities: '公用事業',
  ConsumerCyclical: '非必需消費',
  ConsumerDefensive: '必需消費',
};

export function sectorToZh(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const normalized = raw
    .replace(/&/g, 'And')
    .replace(/[\/_-]/g, '')
    .replace(/\s+/g, '');
  return sectorZhMap[normalized] || raw;
}
