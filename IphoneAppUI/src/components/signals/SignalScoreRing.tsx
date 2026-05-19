import { cn } from "@/lib/utils";

interface SignalScoreRingProps {
  score: number;
  tier: "high" | "medium" | "low";
  tierLabel: string;
  className?: string;
}

const TIER_STROKE: Record<SignalScoreRingProps["tier"], string> = {
  high: "text-accent-purple",
  medium: "text-amber-400",
  low: "text-muted-foreground",
};

export default function SignalScoreRing({
  score,
  tier,
  tierLabel,
  className,
}: SignalScoreRingProps) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className={cn("relative flex h-[68px] w-[68px] shrink-0 items-center justify-center", className)}>
      <svg className="-rotate-90" width="68" height="68" viewBox="0 0 68 68" aria-hidden>
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-white/10"
        />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={TIER_STROKE[tier]}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-none">{score}</span>
        <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">{tierLabel}</span>
      </div>
    </div>
  );
}
