import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SignalCriterionRow } from "@/api/endpoints";

interface SignalCriteriaTableProps {
  rows: SignalCriterionRow[];
}

export default function SignalCriteriaTable({ rows }: SignalCriteriaTableProps) {
  const { t } = useLanguage();
  const [showUnmet, setShowUnmet] = useState(false);

  const applicable = rows.filter((r) => r.applicable);
  const metRows = applicable.filter((r) => r.met);
  const unmetRows = applicable.filter((r) => !r.met);
  const visible = showUnmet ? applicable : metRows;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="rounded-md bg-buy-muted px-2 py-0.5 text-[10px] font-semibold text-buy">
          {t.signalDetail.hitCount(metRows.length, applicable.length)}
        </span>
        {unmetRows.length > 0 && (
          <button
            type="button"
            onClick={() => setShowUnmet((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            {showUnmet ? t.signalDetail.hideUnmet : t.signalDetail.showUnmet}
            {showUnmet ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-card border border-border/60 bg-surface-elevated/80">
        <ul className="divide-y divide-border/30">
          {visible.map((row) => {
            const label =
              t.signalDetail.criteria[row.id as keyof typeof t.signalDetail.criteria] ||
              row.id;
            return (
              <li
                key={row.id}
                className={cn(
                  "flex gap-3 px-3 py-3",
                  !row.met && "opacity-55",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    row.met ? "bg-buy-muted text-buy" : "bg-muted/40 text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {row.met ? (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  {row.detail && (
                    <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                      {row.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
