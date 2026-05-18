import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { searchEntities, type SearchResult } from "@/api/services/search";
import { useDataMode } from "@/context/DataModeContext";
import SearchDiscoverSections from "@/components/search/SearchDiscoverSections";
import { companyPathFromTicker, personPathFromOwnerId } from "@/data/insiderEntities";
import { issuerProfilePath } from "@/data/issuerProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

function tickerFromSubtitle(subtitle: string): string | null {
  const match = subtitle.match(/\$([A-Z0-9.-]+)/i);
  return match ? match[1] : null;
}

function resultPath(item: SearchResult, isInsider: boolean): string | null {
  if (item.type === "politician") return `/insider/person/${item.id}`;
  if (item.type === "owner") return personPathFromOwnerId(item.id);
  if (item.type === "company") {
    const ticker = tickerFromSubtitle(item.subtitle);
    if (ticker) return companyPathFromTicker(ticker);
    return companyPathFromTicker(item.title);
  }
  if (item.type === "issuer") {
    const ticker = tickerFromSubtitle(item.subtitle);
    if (isInsider && ticker) {
      return companyPathFromTicker(ticker);
    }
    return issuerProfilePath(item.id);
  }
  return null;
}

export default function MobileSearch() {
  const { t } = useLanguage();
  const { isInsider, isPolitician } = useDataMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preset = (location.state as { q?: string } | null)?.q;
    if (preset) setQuery(preset);
  }, [location.state]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      searchEntities(q).then((r) => {
        setResults(r.filter((item) => resultPath(item, isInsider) != null));
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isInsider]);

  return (
    <div className="min-h-screen bg-canvas pb-tab-safe">
      <header className="px-4 pb-2 pt-safe">
        <h1 className="text-center text-[17px] font-semibold">{t.tabs.search}</h1>
      </header>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 rounded-xl bg-[#1C1C1E] px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isPolitician ? t.discover.hint : t.live.searchPlaceholderInsider}
            className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-muted"
          />
        </div>

        {query.trim().length < 2 && isPolitician ? <SearchDiscoverSections /> : null}

        {loading && query.trim().length >= 2 && (
          <p className="mt-6 text-center text-sm text-muted">{t.live.searching}…</p>
        )}

        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted">{t.live.empty}</p>
        )}

        <ul className="mt-4 space-y-2">
          {results.map((item) => {
            const path = resultPath(item, isInsider);
            return (
              <li key={`${item.type}-${item.id}`}>
                <button
                  type="button"
                  disabled={!path}
                  onClick={() => path && navigate(path)}
                  className={cn(
                    "w-full rounded-2xl bg-[#1C1C1E] px-4 py-3 text-left",
                    !path && "opacity-50"
                  )}
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.subtitle}</p>
                  <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                    {item.type}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
