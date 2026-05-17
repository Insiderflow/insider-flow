import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Star, Trash2 } from "lucide-react";
import {
  fetchWatchlist,
  removeFromWatchlist,
  type WatchlistType,
} from "@/api/services/watchlist";
import { watchlistRowsFromItems, type WatchlistRow } from "@/lib/watchlistEntries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError } from "@/api/client";

type TabKey = "all" | WatchlistType;

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<TabKey>("all");
  const [rows, setRows] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchWatchlist();
      setRows(watchlistRowsFromItems(items));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
    else setLoading(false);
  }, [isAuthenticated, load]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: t.watchlistPage.tabs.all },
    { key: "politician", label: t.watchlistPage.tabs.politician },
    { key: "company", label: t.watchlistPage.tabs.company },
    { key: "owner", label: t.watchlistPage.tabs.owner },
    { key: "stock", label: t.watchlistPage.tabs.stock },
  ];

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => r.type === tab);
  }, [rows, tab]);

  const handleRemove = async (row: WatchlistRow) => {
    if (!window.confirm(t.watchlistPage.removeConfirm(row.title))) return;
    setRemovingId(row.id);
    try {
      await removeFromWatchlist(row.target);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t.watchlist.error;
      window.alert(msg);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-tab-safe">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-canvas/95 px-3 pb-2 pt-safe backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 py-1 text-xs font-medium text-accent-blue"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.watchlistPage.back}
        </button>
        <h1 className="text-base font-bold tracking-tight">{t.watchlistPage.title}</h1>
        <p className="text-[10px] text-muted">{t.watchlistPage.subtitle}</p>

        <div className="horizontal-scroll mt-3 gap-2 pb-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "snap-card shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold",
                tab === key ? "bg-white text-canvas" : "bg-white/10 text-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 py-3">
        {!isAuthenticated ? (
          <div className="glass-card space-y-3 p-4 text-center">
            <p className="text-sm text-muted">{t.settings.signInRequired}</p>
            <button
              type="button"
              onClick={() => navigate("/paywall")}
              className="rounded-xl bg-accent-blue px-4 py-2 text-sm font-semibold text-white"
            >
              {t.settings.upgradeToPro}
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl shimmer-loading" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <Star className="mx-auto mb-2 h-8 w-8 text-muted" />
            <p className="text-sm text-muted">{t.watchlistPage.empty}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((row) => (
              <li key={row.id} className="glass-card flex items-center gap-2 p-2 pr-3">
                <button
                  type="button"
                  onClick={() => navigate(row.path)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                    {row.title.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.title}</p>
                    <p className="truncate text-xs text-muted">{row.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </button>
                <button
                  type="button"
                  aria-label={t.watchlistPage.remove}
                  disabled={removingId === row.id}
                  onClick={() => void handleRemove(row)}
                  className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-sell disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
