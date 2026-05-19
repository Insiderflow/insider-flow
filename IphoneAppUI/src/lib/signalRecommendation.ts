export type SignalRecommendation = "buy" | "sell" | "hold";

type MlTier = "high" | "medium" | "low";

export function resolveSignalRecommendation(signal: {
  recommendation?: SignalRecommendation;
  side: string;
  mlTier: MlTier;
}): SignalRecommendation {
  if (signal.recommendation) return signal.recommendation;
  if (signal.side === "proposed_sale") return "hold";
  if (signal.mlTier === "low") return "hold";
  if (signal.side === "buy") return "buy";
  if (signal.side === "sell") return "sell";
  return "hold";
}
