import type { Messages } from '@/i18n/types';

const SECTOR_KEYS = new Set([
  'Information Technology',
  'Financials',
  'Industrials',
  'Health Care',
  'Consumer Discretionary',
  'Communication Services',
  'Consumer Staples',
  'Energy',
  'Materials',
  'Real Estate',
  'Utilities',
  'Other',
]);

export function localizePoliticianSeatTitle(
  m: Messages,
  title: string,
  titleKey?: string
): string {
  if (titleKey && titleKey in m.sectors) {
    return m.sectors[titleKey as keyof Messages['sectors']];
  }
  if (titleKey === 'sen') return m.trade.sen;
  if (titleKey === 'rep') return m.trade.rep;
  if (SECTOR_KEYS.has(title)) {
    return m.sectors[title as keyof Messages['sectors']];
  }
  return title;
}
