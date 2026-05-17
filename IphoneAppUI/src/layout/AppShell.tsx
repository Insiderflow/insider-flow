import { Outlet, useLocation, useNavigate } from "react-router-dom";
import TabBar, { type TabId } from "@/components/layout/TabBar";
import { useAuth } from "@/context/AuthContext";
import { isPremiumTab } from "@/lib/premiumAccess";

const TAB_ROUTES: Record<TabId, string> = {
  dashboard: "/",
  live: "/live",
  search: "/search",
  settings: "/settings",
};

function tabFromPath(pathname: string): TabId {
  if (pathname.startsWith("/live")) return "live";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

function hideTabBar(pathname: string) {
  return (
    pathname.startsWith("/insider/") ||
    pathname.startsWith("/issuer/") ||
    pathname.startsWith("/industry-chain") ||
    pathname.startsWith("/prime-broker/") ||
    pathname.startsWith("/industry-compare") ||
    pathname.startsWith("/paywall") ||
    pathname.startsWith("/settings/subscription") ||
    pathname.startsWith("/settings/watchlist") ||
    pathname.startsWith("/settings/notifications") ||
    pathname.startsWith("/legal/")
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isPaid } = useAuth();
  const active = tabFromPath(pathname);
  const showTab = !hideTabBar(pathname);

  const onTabChange = (tab: TabId) => {
    if (!isPaid && isPremiumTab(tab)) {
      navigate("/paywall");
      return;
    }
    navigate(TAB_ROUTES[tab]);
  };

  return (
    <div className="min-h-screen">
      <Outlet />
      {showTab && <TabBar active={active} onChange={onTabChange} />}
    </div>
  );
}
