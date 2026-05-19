import { cn } from "@/lib/utils";

export type ScoreBreakdown = {
  flags: number;
  size: number;
  cluster: number;
  recency: number;
  late: number;
};

type SegmentKey = keyof ScoreBreakdown;

interface SignalScoreBreakdownProps {
  breakdown: ScoreBreakdown;
  labels: Record<SegmentKey, string>;
  title: string;
  className?: string;
}

const SEGMENT_CLASS: Record<SegmentKey, string> = {
  flags: "bg-accent-purple",
  size: "bg-buy",
  cluster: "bg-sky-400",
  recency: "bg-amber-400",
  late: "bg-orange-500",
};

const SEGMENT_ORDER: SegmentKey[] = ["flags", "size", "cluster", "recency", "late"];

export default function SignalScoreBreakdown({
  breakdown,
  labels,
  title,
  className,
}: SignalScoreBreakdownProps) {
  const total = SEGMENT_ORDER.reduce((sum, k) => sum + breakdown[k], 0) || 1;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        {SEGMENT_ORDER.map((key) => {
          const value = breakdown[key];
          if (value <= 0) return null;
          return (
            <div
              key={key}
              className={cn("h-full min-w-[2px] transition-all", SEGMENT_CLASS[key])}
              style={{ width: `${(value / total) * 100}%` }}
              title={`${labels[key]} ${value}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {SEGMENT_ORDER.map((key) => {
          const value = breakdown[key];
          if (value <= 0) return null;
          return (
            <span key={key} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", SEGMENT_CLASS[key])} />
              {labels[key]} {value}
            </span>
          );
        })}
      </div>
    </div>
  );
}
