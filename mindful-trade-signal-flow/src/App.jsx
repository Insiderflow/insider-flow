import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import RouteGuard from '@/components/layout/RouteGuard';

// Pages
import Dashboard from '@/pages/Dashboard';
import Search from '@/pages/Search';
import PoliticianTrades from '@/pages/PoliticianTrades';
import CorporateInsiders from '@/pages/CorporateInsiders';
import Watchlist from '@/pages/Watchlist';
import PoliticianProfile from '@/pages/PoliticianProfile';
import IssuerProfile from '@/pages/IssuerProfile';
import OpenInsiderExplorer from '@/pages/OpenInsiderExplorer';
import Welcome from '@/pages/Welcome';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Settings from '@/pages/Settings';
import Paywall from '@/pages/Paywall';
import Alerts from '@/pages/Alerts';
import AdminOps from '@/pages/AdminOps';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="dark fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app shell */}
      <Route element={<RouteGuard><AppLayout /></RouteGuard>}>
        {/* Bottom-tab routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/ops" element={<AdminOps />} />

        {/* Detail / stack routes */}
        <Route path="/politician" element={<PoliticianProfile />} />
        <Route path="/issuer" element={<IssuerProfile />} />
        <Route path="/openinsider" element={<OpenInsiderExplorer />} />
        <Route path="/openinsider/company" element={<OpenInsiderExplorer />} />
        <Route path="/openinsider/owner" element={<OpenInsiderExplorer />} />

        {/* Legacy */}
        <Route path="/politicians" element={<PoliticianTrades />} />
        <Route path="/corporate" element={<CorporateInsiders />} />

        {/* Paywall (full-screen, no bottom nav) */}
        <Route path="/paywall" element={<Paywall />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;