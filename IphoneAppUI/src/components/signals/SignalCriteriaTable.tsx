import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SignalCriterionRow } from "@/api/endpoints";

interface SignalCriteriaTableProps {
  rows: SignalCriterionRow[];
}

export default function SignalCriteriaTable({ rows }: SignalCriteriaTableProps) {
  const { t } = useLanguage();
  const visible = rows.filter((r) => r.applicable);

  return (
    <div className="overflow-hidden rounded-card border border-border/60 bg-surface-elevated/80">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20">
            <th className="w-10 px-3 py-2.5 font-medium text-muted-foreground" />
            <th className="px-2 py-2.5 font-medium text-muted-foreground">
              {t.signalDetail.criteriaCol}
            </th>
            <th className="hidden px-3 py-2.5 font-medium text-muted-foreground sm:table-cell">
              {t.signalDetail.detailCol}
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => {
            const label =
              t.signalDetail.criteria[row.id as keyof typeof t.signalDetail.criteria] ||
              row.id;
            return (
              <tr
                key={row.id}
                className="border-b border-border/30 last:border-0"
              >
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      row.met
                        ? "bg-buy-muted text-buy"
                        : "bg-muted/40 text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {row.met ? (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <X className="h-3.5 w-3.5 stroke-[2.5] opacity-60" />
                    )}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <p className="font-medium text-foreground">{label}</p>
                  {row.detail && (
                    <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground sm:hidden">
                      {row.detail}
                    </p>
                  )}
                </td>
                <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                  {row.detail ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
