/**
 * OpenInsider Form 4 transaction_type strings use "Sale" not "Sell"
 * (e.g. "S - Sale", "S - Sale+OE", "P - Purchase").
 */

export function isOpenInsiderSell(transactionType: string): boolean {
  const t = transactionType.toLowerCase().trim();
  if (!t) return false;
  if (t.includes('purchase')) return false;
  if (t.startsWith('p -') || t.startsWith('p-')) return false;
  if (t.startsWith('s -') || t.startsWith('s-')) return true;
  if (t.includes('sale')) return true;
  if (t.includes('sell')) return true;
  if (t.includes('dispose')) return true;
  return false;
}

export function isOpenInsiderBuy(transactionType: string): boolean {
  if (isOpenInsiderSell(transactionType)) return false;
  const t = transactionType.toLowerCase().trim();
  if (t.startsWith('p -') || t.startsWith('p-')) return true;
  if (t.includes('purchase')) return true;
  if (t.includes('buy')) return true;
  return false;
}

export function openInsiderSide(
  transactionType: string
): 'buy' | 'sell' {
  return isOpenInsiderSell(transactionType) ? 'sell' : 'buy';
}

/** Form 4 value_numeric is often negative for sales; always aggregate magnitude. */
export function openInsiderTradeValue(valueNumeric: unknown): number {
  return Math.abs(Number(valueNumeric ?? 0));
}
