import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authEndpoints } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/AuthContext';
import { Shield, TrendingUp, Landmark, Building2, Eye, ChevronRight, Lock } from 'lucide-react';

const FEATURES = [
  {
    icon: Landmark,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    title: 'Politician Trades',
    desc: 'Real-time STOCK Act filings from Congress members.',
  },
  {
    icon: Building2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    title: 'Corporate Insiders',
    desc: 'SEC Form 4 purchases & sales by C-suite and directors.',
  },
  {
    icon: Eye,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    title: 'Smart Watchlist',
    desc: 'Track tickers, politicians, and insiders in one feed.',
  },
];

const STATS = [
  { value: '10,000+', label: 'Filings tracked' },
  { value: '535', label: 'Congress members' },
  { value: 'Real-time', label: 'SEC updates' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth, checkUserAuth } = useAuth();
  const nextPath = new URLSearchParams(location.search).get('next') || '/';
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate, nextPath]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'register') {
        await authEndpoints.register({ email, password, full_name: email.split('@')[0] });
        setMode('login');
        setPassword('');
        setMessage('Registration successful. Please login.');
      } else {
        await authEndpoints.login({ email, password });
        await checkUserAuth({ force: true });
        navigate(nextPath, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="dark fixed inset-0 flex items-center justify-center bg-[hsl(222,47%,7%)]">
        <div className="w-8 h-8 border-4 border-[hsl(222,35%,16%)] border-t-[hsl(217,91%,60%)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col overflow-hidden">

      {/* Hero gradient blob */}
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

      {/* Top brand bar */}
      <header className="relative flex items-center gap-2 px-6 pt-12 pb-2">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-primary-foreground font-bold text-sm">IF</span>
        </div>
        <div>
          <p className="text-base font-bold tracking-tight leading-none">Insider Flow</p>
          <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Follow the smart money</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Secure session</span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-8 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-buy/10 border border-buy/20 mb-4">
          <TrendingUp className="h-3 w-3 text-buy" />
          <span className="text-[11px] font-semibold text-buy">Live SEC & STOCK Act Data</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight mb-3">
          Trade with<br />
          <span className="text-primary">insider intelligence.</span>
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          Monitor every disclosed trade from senators, representatives, and corporate executives — before the market reacts.
        </p>
      </section>

      {/* Stats strip */}
      <div className="mx-6 rounded-2xl bg-card border border-border/50 grid grid-cols-3 divide-x divide-border/50 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 px-1">
            <span className="text-sm font-bold text-foreground">{s.value}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Feature list */}
      <div className="px-6 space-y-2.5 flex-1">
        {FEATURES.map(f => (
          <div key={f.title} className="flex items-start gap-3 bg-card rounded-xl border border-border/50 px-4 py-3.5">
            <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <f.icon className={`h-4 w-4 ${f.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">{f.title}</p>
              <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pt-6 pb-10 space-y-3">
        {/* Primary CTA */}
        <div className="space-y-2">
          <div className="flex rounded-xl bg-secondary/60 p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold ${mode === 'register' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Register
            </button>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-12 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-12 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm outline-none"
          />
          {error && <p className="text-xs text-sell">{error}</p>}
          {message && <p className="text-xs text-buy">{message}</p>}
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-primary font-medium w-full text-left"
            >
              Forgot password?
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-2xl h-13 text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-70"
            style={{ height: '52px' }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="h-4 w-4" />
                {mode === 'login' ? 'Sign in securely' : 'Create account'}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </>
            )}
          </button>
        </div>

        {/* Social login placeholder — hidden until enabled */}
        {false && (
          <button className="w-full flex items-center justify-center gap-2 border border-border/70 text-foreground font-medium rounded-2xl h-13 text-sm bg-card" style={{ height: '48px' }}>
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
            Continue with Google
          </button>
        )}

        <p className="text-center text-[11px] text-muted-foreground leading-relaxed px-4">
          By signing in, you agree to our{' '}
          <span className="text-primary underline-offset-2 hover:underline cursor-pointer">Terms of Service</span>
          {' '}and{' '}
          <span className="text-primary underline-offset-2 hover:underline cursor-pointer">Privacy Policy</span>.
          <br />Your session is encrypted and secured.
        </p>
      </div>
    </div>
  );
}