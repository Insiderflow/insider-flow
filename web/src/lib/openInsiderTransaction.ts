/**
 * OpenInsider Form 4 transaction_type strings (e.g. "P - Purchase", "S - Sale+OE").
 * Market buy/sell counts must use SEC transaction codes P and S only — not every
 * non-sale row (awards, tax, conversions) which previously inflated buy counts.
 */

export type OpenInsiderMarketSide = 'buy' | 'sell';

export type OpenInsiderActivitySide =
  | OpenInsiderMarketSide
  | 'option'
  | 'other';

/** Leading SEC transaction code letter from OpenInsider type label. */
export function openInsiderTxCode(transactionType: string): string {
  const m = String(transactionType || '')
    .trim()
    .match(/^([A-Za-z])\s*-/);
  return m ? m[1].toUpperCase() : '';
}

/** Open-market purchase (P). */
export function isOpenInsiderBuy(transactionType: string): boolean {
  return openInsiderTxCode(transactionType) === 'P';
}

/** Open-market sale (S), including Rule 10b5-1 (S - Sale+OE). */
export function isOpenInsiderSell(transactionType: string): boolean {
  return openInsiderTxCode(transactionType) === 'S';
}

/** Sale filed under a Rule 10b5-1 plan (+OE suffix on OpenInsider). */
export function isOpenInsider10b51(transactionType: string): boolean {
  if (!isOpenInsiderSell(transactionType)) return false;
  const t = transactionType.toLowerCase();
  return t.includes('+oe') || t.includes('10b5');
}

/** Non-market Form 4 activity (exercise, award, tax, conversion, etc.). */
export function isOpenInsiderOption(transactionType: string): boolean {
  const code = openInsiderTxCode(transactionType);
  if (!code || code === 'P' || code === 'S') return false;
  return true;
}

export function openInsiderActivitySide(
  transactionType: string,
): OpenInsiderActivitySide {
  if (isOpenInsiderBuy(transactionType)) return 'buy';
  if (isOpenInsiderSell(transactionType)) return 'sell';
  if (isOpenInsiderOption(transactionType)) return 'option';
  return 'other';
}

/** Market side for trade lists; non-market rows return null. */
export function openInsiderMarketSide(
  transactionType: string,
): OpenInsiderMarketSide | null {
  if (isOpenInsiderBuy(transactionType)) return 'buy';
  if (isOpenInsiderSell(transactionType)) return 'sell';
  return null;
}

/** @deprecated Prefer openInsiderMarketSide or openInsiderActivitySide. */
export function openInsiderSide(
  transactionType: string,
): OpenInsiderActivitySide {
  return openInsiderActivitySide(transactionType);
}

/** Form 4 value_numeric is often negative for sales; always aggregate magnitude. */
export function openInsiderTradeValue(valueNumeric: unknown): number {
  return Math.abs(Number(valueNumeric ?? 0));
}
