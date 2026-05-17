import { cn } from "@/lib/utils";
import type { LiveDateChip } from "@/data/liveMockData";

interface DateChipsProps {
  dates: LiveDateChip[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function DateChips({ dates, selected, onSelect }: DateChipsProps) {
  return (
    <div className="horizontal-scroll -mx-0 gap-2 px-0">
      {dates.map((d) => {
        const active = selected === d.id;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            className={cn(
              "snap-card rounded-pill px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white text-black"
                : "border border-border bg-surface-elevated text-muted-foreground"
            )}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
