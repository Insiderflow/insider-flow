import { cn } from "@/lib/utils";

interface InsiderProfileHeroProps {
  logoLabel: string;
  logoColor: string;
  displayName: string;
  ticker: string;
  exchange?: string;
  className?: string;
}

export default function InsiderProfileHero({
  logoLabel,
  logoColor,
  displayName,
  ticker,
  exchange = "US",
  className,
}: InsiderProfileHeroProps) {
  return (
    <div className={cn("profile-hero relative overflow-hidden rounded-2xl p-4", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse 90% 80% at 0% 0%, ${logoColor}55, transparent 55%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(20, 184, 166, 0.12), transparent)`,
        }}
      />
      <div className="relative flex gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-base font-bold backdrop-blur-sm"
          style={{ color: logoColor }}
        >
          {logoLabel}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-[15px] font-bold leading-snug tracking-tight text-white">
            {displayName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-flow">
              {ticker}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
              {exchange}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
