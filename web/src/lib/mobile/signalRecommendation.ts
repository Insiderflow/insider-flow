export type SignalRecommendation = 'buy' | 'sell' | 'hold';

export type SignalTradeSide = 'buy' | 'sell' | 'proposed_sale';

type MlSignalTier = 'high' | 'medium' | 'low';

/**
 * Action hint for the user (買/賣/持), not the raw filing direction.
 * Medium+ conviction required to issue 買/賣; otherwise 持.
 */
export function computeSignalRecommendation(input: {
  side: SignalTradeSide;
  mlTier: MlSignalTier;
}): SignalRecommendation {
  if (input.side === 'proposed_sale') return 'hold';
  if (input.mlTier === 'low') return 'hold';
  if (input.side === 'buy') return 'buy';
  if (input.side === 'sell') return 'sell';
  return 'hold';
}

export function passesRecommendationFilter(
  recommendation: SignalRecommendation,
  sideFilter: 'all' | 'buy' | 'sell' | 'hold',
): boolean {
  if (sideFilter === 'all') return true;
  return recommendation === sideFilter;
}
