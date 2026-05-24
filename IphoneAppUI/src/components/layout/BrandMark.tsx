import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export default function BrandMark({ compact, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flow/15 ring-1 ring-flow/30"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-flow" fill="none">
          <path
            d="M4 14 L12 6 L20 14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 14 L12 18 L16 14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </svg>
      </span>
      {!compact && (
        <div className="min-w-0 leading-none">
          <p className="text-[15px] font-bold tracking-tight text-white">Insider Flow</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-flow">
            Alt data
          </p>
        </div>
      )}
    </div>
  );
}
