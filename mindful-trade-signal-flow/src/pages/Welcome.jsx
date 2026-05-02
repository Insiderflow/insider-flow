import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { authEndpoints } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/AuthContext';
import { isMobileTransport } from '@/lib/authTransport';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function isAppleSignInUserCancellation(err) {
  if (err == null) return false;
  const msg = typeof err === 'string' ? err : err instanceof Error ? err.message : '';
  const code =
    typeof err === 'object' && err !== null && ('code' in err || 'errorCode' in err)
      ? err.code ?? err.errorCode
      : undefined;
  if (code === '1001' || code === 1001 || code === 'ERR_CANCELED') return true;
  const blob = `${msg} ${code ?? ''}`;
  return /cancel|cancell|dismiss|1001|authorization canceled|authorization cancelled|aslauthorizationerrordomain/i.test(blob);
}

function AppleLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

function FacebookLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

/** White “G” shape (same geometry as the colored mark; inherits `currentColor`). */
function GoogleLogoMono({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </g>
    </svg>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth, checkUserAuth } = useAuth();
  const nextPath = new URLSearchParams(location.search).get('next') || '/';

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const mobileAuth = isMobileTransport();
  const nativeShell = Capacitor.isNativePlatform();

  const showAppleSignIn = useMemo(() => {
    if (!nativeShell || Capacitor.getPlatform() !== 'ios') return false;
    return Boolean(import.meta.env.VITE_APPLE_IOS_CLIENT_ID?.trim());
  }, [nativeShell]);

  const apiBaseTrim = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
    [],
  );

  const showGoogleMobile = mobileAuth && Boolean(import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID?.trim());
  const showGoogleWebRedirect = !mobileAuth && Boolean(apiBaseTrim);

  const showFacebookMobile = mobileAuth && Boolean(import.meta.env.VITE_FACEBOOK_APP_ID?.trim());
  const showFacebookWebRedirect = showGoogleWebRedirect;

  const showSocialTray =
    showFacebookWebRedirect ||
    showFacebookMobile ||
    showGoogleMobile ||
    showGoogleWebRedirect ||
    showAppleSignIn;

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate, nextPath]);

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mobileAuth) {
        const cid = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID?.trim();
        if (!cid) {
          setError('Google sign-in requires VITE_GOOGLE_WEB_CLIENT_ID.');
          return;
        }
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        await GoogleAuth.initialize({
          clientId: cid,
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
        const res = await GoogleAuth.signIn();
        const idToken = res.authentication?.idToken;
        if (!idToken) throw new Error('No Google ID token');
        await authEndpoints.loginWithGoogle({ idToken });
        await checkUserAuth({ force: true });
        navigate(nextPath, { replace: true });
      } else {
        if (!apiBaseTrim) {
          setError('Google sign-in requires VITE_API_BASE_URL.');
          return;
        }
        const callbackUrl = window.location.href.split('#')[0];
        window.location.href = `${apiBaseTrim}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (/popup.*closed|access_denied/i.test(msg)) return;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebook = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mobileAuth) {
        const appId = import.meta.env.VITE_FACEBOOK_APP_ID?.trim();
        if (!appId) {
          setError('Facebook login requires VITE_FACEBOOK_APP_ID (same as FACEBOOK_CLIENT_ID).');
          return;
        }
        const { FacebookLogin } = await import('@capacitor-community/facebook-login');
        await FacebookLogin.initialize({
          appId,
          autoLogAppEvents: false,
          xfbml: false,
          version: 'v21.0',
          locale: 'en_US',
        });
        const res = await FacebookLogin.login({
          permissions: ['email', 'public_profile'],
        });
        const token = res.accessToken?.token;
        if (!token) throw new Error('No Facebook access token');
        await authEndpoints.loginWithFacebook({ accessToken: token });
        await checkUserAuth({ force: true });
        navigate(nextPath, { replace: true });
      } else {
        if (!apiBaseTrim) {
          setError('Facebook sign-in requires VITE_API_BASE_URL.');
          return;
        }
        const callbackUrl = window.location.href.split('#')[0];
        window.location.href = `${apiBaseTrim}/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (/cancel|permission/i.test(msg)) return;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
      const clientId = import.meta.env.VITE_APPLE_IOS_CLIENT_ID?.trim();
      if (!clientId) {
        setError('Apple Sign-In is not configured.');
        return;
      }
      const res = await SignInWithApple.authorize({
        clientId,
        redirectURI:
          import.meta.env.VITE_APPLE_REDIRECT_URI?.trim() || 'https://www.insiderflow.asia/',
        scopes: 'email name',
        state: crypto.randomUUID(),
        nonce: crypto.randomUUID(),
      });
      const token = res.response?.identityToken;
      if (!token) throw new Error('No Apple identity token');
      await authEndpoints.loginWithApple({ identityToken: token });
      await checkUserAuth({ force: true });
      navigate(nextPath, { replace: true });
    } catch (err) {
      if (isAppleSignInUserCancellation(err)) return;
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openEmailPanel = (nextMode) => {
    setMode(nextMode);
    setEmailPanelOpen(true);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setMessage('Registration successful. Please sign in.');
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
        <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  /** Three stacked black capsules — Apple → Google → Facebook (matches dark-mode pill mock). */
  const oauthFocus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(222,47%,7%)]';

  const darkCapsuleBtn =
    `relative flex h-[52px] w-full items-center justify-center rounded-full bg-black px-5 text-[15px] font-bold tracking-tight text-white transition-[transform,opacity,background-color] hover:bg-neutral-900 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 ${oauthFocus}`;
  const darkCapsuleIcon =
    'pointer-events-none absolute left-5 flex size-[26px] items-center justify-center text-white';

  const emailChip =
    'w-full h-[52px] rounded-xl font-semibold text-[15px] tracking-tight flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none shadow-sm';

  return (
    <div className="dark min-h-[100dvh] bg-[hsl(222,47%,7%)] text-foreground flex flex-col items-center px-6 py-10 sm:py-14">
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="relative w-full max-w-[400px] flex flex-col gap-10">
        <header className="text-center space-y-3">
          <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25">
            IF
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-snug">
              Pick a sign-in option to continue.
            </p>
          </div>
        </header>

        <section className="space-y-4">
          {showSocialTray && (
            <div className="flex flex-col gap-3">
              {showAppleSignIn && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleAppleSignIn}
                  className={darkCapsuleBtn}
                >
                  <span className={darkCapsuleIcon}>
                    <AppleLogo className="size-[22px]" />
                  </span>
                  <span>Continue with Apple</span>
                </button>
              )}

              {(showGoogleMobile || showGoogleWebRedirect) && (
                <button type="button" disabled={loading} onClick={handleGoogle} className={darkCapsuleBtn}>
                  <span className={darkCapsuleIcon}>
                    <GoogleLogoMono className="size-[22px]" />
                  </span>
                  <span>Continue with Google</span>
                </button>
              )}

              {(showFacebookWebRedirect || showFacebookMobile) && (
                <button type="button" disabled={loading} onClick={handleFacebook} className={darkCapsuleBtn}>
                  <span className={darkCapsuleIcon}>
                    <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-white/[0.14]">
                      <FacebookLogo className="size-[17px]" />
                    </span>
                  </span>
                  <span>Continue with Facebook</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-border/70" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Email
            </span>
            <span className="h-px flex-1 bg-border/70" />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => openEmailPanel('login')}
            className={`${emailChip} bg-secondary/80 text-foreground border border-border/60 hover:bg-secondary`}
          >
            Sign in with email
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => openEmailPanel('register')}
            className={`${emailChip} bg-transparent text-foreground border border-border/70 hover:bg-secondary/40`}
          >
            Create account
          </button>
        </section>

        {emailPanelOpen && (
          <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 space-y-4 shadow-xl shadow-black/20">
            <div className="flex rounded-lg bg-secondary/50 p-0.5">
              <button
                type="button"
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${mode === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${mode === 'register' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-11 rounded-xl bg-secondary/50 border border-border/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-11 rounded-xl bg-secondary/50 border border-border/50 px-3 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && <p className="text-xs text-sell">{error}</p>}
              {message && <p className="text-xs text-buy">{message}</p>}

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-primary font-medium"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'login' ? (
                  'Sign in securely'
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </section>
        )}

        <footer className="text-center text-[11px] text-muted-foreground leading-relaxed px-1 pb-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
          <br />
          <span className="opacity-90">Your session is encrypted and secured.</span>
        </footer>
      </div>
    </div>
  );
}
