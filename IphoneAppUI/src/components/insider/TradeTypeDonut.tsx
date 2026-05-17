interface Segment {
  label: string;
  pct: number;
  color: string;
}

interface TradeTypeDonutProps {
  segments: Segment[];
  size?: number;
}

export default function TradeTypeDonut({ segments, size = 88 }: TradeTypeDonutProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const active = segments.filter((s) => s.pct > 0);
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {active.map((seg) => {
          const dash = (seg.pct / 100) * circumference;
          const el = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <ul className="space-y-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-muted-foreground">
              {seg.label}{" "}
              <span className="font-semibold text-white">{seg.pct}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
