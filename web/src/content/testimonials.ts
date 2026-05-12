/**
 * Reader quotes (anonymous OK). Only set `published: true` for wording you have
 * permission to use. Optional `ratingValue` (4–5) only if the reader gave an explicit score.
 * Optional `imageSrc`: file under `web/public/` (e.g. `/testimonials/review-1.png`).
 */
export type Testimonial = {
  id: string;
  published: boolean;
  quoteHant: string;
  quoteHans: string;
  quoteEn: string;
  authorLabelHant: string;
  authorLabelHans: string;
  authorSchemaName: string;
  datePublished?: string;
  ratingValue?: 4 | 5;
  imageSrc?: string;
  imageAltHant?: string;
  imageAltHans?: string;
  imageAltEn?: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'anon-hk-2026-04',
    published: true,
    quoteHant:
      '付費解鎖議員頁之後，持倉跟委員會產業的對照清楚很多，少了自己翻官方 PDF 的時間。',
    quoteHans:
      '付费解锁议员页之后，持仓跟委员会产业的对照清楚很多，少了翻官方 PDF 的时间。',
    quoteEn:
      'After unlocking politician pages, holdings vs committee sectors finally click—less time in official PDFs.',
    authorLabelHant: '匿名 · 香港長倉投資人',
    authorLabelHans: '匿名 · 香港长仓投资人',
    authorSchemaName: 'Anonymous reader (Hong Kong)',
    datePublished: '2026-04-12',
    imageSrc: '/testimonials/placeholder-card.svg',
    imageAltHant: '讀者回饋截圖示意（可替換為真實截圖）',
    imageAltHans: '读者反馈截图示意（可替换为真实截图）',
    imageAltEn: 'Optional testimonial screenshot placeholder',
  },
  {
    id: 'anon-tw-2026-04',
    published: true,
    quoteHant: '先用免費 /trades 表，再加 Substack 週報就夠日常；後來還是升級看圖表跟發行商拆解。',
    quoteHans: '先用免费 /trades 表，再加 Substack 周报就够日常；后来还是升级看图表跟发行商拆解。',
    quoteEn:
      'Free /trades plus the weekly Substack was enough day-to-day; upgraded later for charts and issuer breakdowns.',
    authorLabelHant: '匿名 · 台灣散戶',
    authorLabelHans: '匿名 · 台湾散户',
    authorSchemaName: 'Anonymous reader (Taiwan)',
    datePublished: '2026-04-28',
  },
];

export function getPublishedTestimonials(): Testimonial[] {
  return TESTIMONIALS.filter((t) => t.published);
}
