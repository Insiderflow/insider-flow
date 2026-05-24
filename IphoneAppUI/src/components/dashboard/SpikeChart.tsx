import { useId } from "react";
import { cn } from "@/lib/utils";

export type SpikeVariant = "buy" | "sell" | "proposed" | "plan" | "neutral";

interface SpikeChartProps {
  data: number[];
  variant?: SpikeVariant;
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}

const STROKE: Record<SpikeVariant, string> = {
  buy: "#34D399",
  sell: "#FB7185",
  proposed: "#FBBF24",
  plan: "#22D3EE",
  neutral: "#64748B",
};

const FILL: Record<SpikeVariant, string> = {
  buy: "rgba(52, 211, 153, 0.25)",
  sell: "rgba(251, 113, 133, 0.25)",
  proposed: "rgba(251, 191, 36, 0.25)",
  plan: "rgba(34, 211, 238, 0.25)",
  neutral: "rgba(100, 116, 139, 0.2)",
};

export default function SpikeChart({
  data,
  variant = "buy",
  width = 72,
  height = 28,
  className,
  animate = true,
}: SpikeChartProps) {
  const gradId = useId();
  if (!data.length) return null;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const max = Math.max(...data, 0.001);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${pad + w},${pad + h} L ${pad},${pad + h} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", animate && "opacity-90", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={STROKE[variant]} stopOpacity="0.5" />
          <stop offset="100%" stopColor={STROKE[variant]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={STROKE[variant]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${FILL[variant]})` }}
      />
    </svg>
  );
}
