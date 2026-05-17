import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataModeProvider } from "@/context/DataModeContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import RequireAuth from "@/components/auth/RequireAuth";
import RequirePaid from "@/components/auth/RequirePaid";
import AppShell from "@/layout/AppShell";
import MobileLogin from "@/pages/MobileLogin";
import MobileDashboard from "@/pages/MobileDashboard";
import MobileLive from "@/pages/MobileLive";
import MobilePaywall from "@/pages/MobilePaywall";
import MobileSearch from "@/pages/MobileSearch";
import MobileManageSubscription from "@/pages/MobileManageSubscription";
import MobileSettings from "@/pages/MobileSettings";
import InsiderPersonPage from "@/pages/insider/InsiderPersonPage";
import InsiderCompanyPage from "@/pages/insider/InsiderCompanyPage";
import IssuerProfilePage from "@/pages/issuer/IssuerProfilePage";
import IndustryChainPage from "@/pages/IndustryChainPage";
import PrimeBrokerPage from "@/pages/PrimeBrokerPage";
import IndustryComparePage from "@/pages/IndustryComparePage";
import WatchlistPage from "@/pages/settings/WatchlistPage";
import NotificationSettingsPage from "@/pages/settings/NotificationSettingsPage";
import LegalDocumentPage from "@/pages/LegalDocumentPage";
import AnalyticsPageView from "@/components/analytics/AnalyticsPageView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <LanguageProvider>
      <DataModeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
              <AnalyticsPageView />
              <Routes>
                <Route path="/login" element={<MobileLogin />} />
                <Route element={<AppShell />}>
                  <Route path="/" element={<MobileDashboard />} />
                  <Route path="/settings" element={<MobileSettings />} />
                  <Route path="/settings/watchlist" element={<WatchlistPage />} />
                  <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
                  <Route path="/legal/:docId" element={<LegalDocumentPage />} />
                  <Route path="/paywall" element={<MobilePaywall />} />
                  <Route element={<RequireAuth />}>
                    <Route path="/settings/subscription" element={<MobileManageSubscription />} />
                  </Route>
                  <Route element={<RequirePaid />}>
                    <Route path="/live" element={<MobileLive />} />
                    <Route path="/search" element={<MobileSearch />} />
                    <Route path="/insider/person/:id" element={<InsiderPersonPage />} />
                    <Route path="/insider/company/:id" element={<InsiderCompanyPage />} />
                    <Route path="/issuer/:id" element={<IssuerProfilePage />} />
                    <Route path="/industry-chain" element={<IndustryChainPage />} />
                    <Route path="/prime-broker/:id" element={<PrimeBrokerPage />} />
                    <Route path="/industry-compare" element={<IndustryComparePage />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </QueryClientProvider>
        </AuthProvider>
      </DataModeProvider>
    </LanguageProvider>
  );
}
