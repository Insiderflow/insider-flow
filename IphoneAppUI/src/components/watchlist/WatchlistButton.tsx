import { useEffect, useState } from "react";
import { Eye, Loader2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import {
  addToWatchlist,
  isOnWatchlist,
  removeFromWatchlist,
  type WatchlistTarget,
} from "@/api/services/watchlist";
import { USE_FIXTURE_BUILDERS } from "@/api/config";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  target: WatchlistTarget;
  /** Politician profile: full-width CTA like production web */
  variant?: "default" | "cta";
  className?: string;
}

export default function WatchlistButton({
  target,
  variant = "default",
  className,
}: WatchlistButtonProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (USE_FIXTURE_BUILDERS || !isAuthenticated) {
      setWatching(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    isOnWatchlist(target)
      .then((on) => {
        if (!cancelled) setWatching(on);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, target.type, target.politicianId, target.companyId, target.ownerId, target.ticker]);

  const handleClick = async () => {
    if (USE_FIXTURE_BUILDERS) {
      window.alert(t.settings.comingSoon);
      return;
    }
    if (!isAuthenticated) {
      navigate("/paywall");
      return;
    }

    setBusy(true);
    try {
      if (watching) {
        await removeFromWatchlist(target);
        setWatching(false);
      } else {
        await addToWatchlist(target);
        setWatching(true);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t.watchlist.error;
      window.alert(msg);
    } finally {
      setBusy(false);
    }
  };

  const isCta = variant === "cta";
  const disabled = loading || busy;

  const base = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    isCta
      ? "min-h-12 w-full rounded-xl px-4 py-3 text-sm shadow-lg"
      : "rounded-lg px-3 py-2 text-xs",
    className
  );

  const tone = !isAuthenticated
    ? "bg-white/10 text-muted-foreground ring-1 ring-border"
    : watching
      ? isCta
        ? "bg-white/12 text-white ring-1 ring-border"
        : "bg-sell/20 text-sell ring-1 ring-sell/30"
      : isCta
        ? "bg-accent-blue text-white ring-1 ring-accent-blue/40"
        : "bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/30";

  let label = t.watchlist.add;
  if (loading || busy) label = t.watchlist.processing;
  else if (!isAuthenticated) label = t.watchlist.signInToAdd;
  else if (watching) label = t.watchlist.watching;
  else if (isCta && target.type === "politician") label = t.watchlist.trackPolitician;
  else if (target.type === "stock") label = t.watchlist.trackStock;
  else if (target.type === "owner") label = t.watchlist.trackInsider;

  return (
    <button type="button" onClick={handleClick} disabled={disabled} className={cn(base, tone)}>
      {loading || busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : watching ? (
        <Star className="h-4 w-4 shrink-0 fill-current" />
      ) : (
        <Eye className="h-4 w-4 shrink-0" />
      )}
      <span>{label}</span>
    </button>
  );
}
