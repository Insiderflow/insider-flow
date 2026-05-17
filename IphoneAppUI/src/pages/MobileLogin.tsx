import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { mobileApi } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { isPaidUser } from "@/lib/membership";
import { postAuthRedirectPath } from "@/lib/premiumAccess";

type AuthMode = "login" | "register";

export default function MobileLogin() {
  const { t } = useLanguage();
  const { login, user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={postAuthRedirectPath(from, isPaidUser(user))} replace />;
  }

  const isLogin = mode === "login";

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
  };

  const registerErrorMessage = (err: unknown): string => {
    if (!(err instanceof ApiError)) return t.auth.registerFailed;
    if (err.status === 409 || err.message.includes("already exists")) {
      return t.auth.emailExists;
    }
    if (err.message.includes("at least 8")) return t.auth.passwordTooShort;
    if (err.message && !err.message.startsWith("HTTP")) return err.message;
    return t.auth.registerFailed;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const me = await mobileApi.authMe().catch(() => null);
      const paid = me ? isPaidUser(me.user) : false;
      navigate(postAuthRedirectPath(from, paid), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.auth.loginFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError(t.auth.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setSubmitting(true);
    try {
      await mobileApi.authRegister(email.trim(), password, name.trim() || undefined);
      setSuccess(t.auth.verifyEmailSent);
      setPassword("");
      setConfirmPassword("");
      setMode("login");
    } catch (err) {
      setError(registerErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={isLogin ? t.auth.loginTitle : t.auth.registerTitle}
      subtitle={isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}
      termsHint={isLogin ? t.auth.termsHint : t.auth.registerTermsHint}
      switchLabel={isLogin ? t.auth.switchToRegister : t.auth.switchToLogin}
      onSwitch={() => switchMode(isLogin ? "register" : "login")}
    >
      <form onSubmit={isLogin ? handleLogin : handleRegister} className="mt-8 space-y-4">
        {!isLogin && (
          <AuthField
            id="name"
            label={t.auth.name}
            type="text"
            autoComplete="name"
            value={name}
            onChange={setName}
            placeholder={t.auth.namePlaceholder}
          />
        )}

        <AuthField
          id="email"
          label={t.auth.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          required
        />

        <AuthField
          id="password"
          label={t.auth.password}
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={password}
          onChange={setPassword}
          required
        />

        {!isLogin && (
          <AuthField
            id="confirmPassword"
            label={t.auth.confirmPassword}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
        )}

        {success && (
          <p
            className="rounded-xl border border-buy/30 bg-buy/10 px-3 py-2.5 text-sm text-buy"
            role="status"
          >
            {success}
          </p>
        )}

        {error && (
          <p className="text-sm text-sell" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent-blue py-3.5 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {submitting
            ? isLogin
              ? t.auth.signingIn
              : t.auth.signingUp
            : isLogin
              ? t.auth.signIn
              : t.auth.signUp}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthField({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-[#1C1C1E] px-4 py-3 text-[15px] outline-none focus:border-accent-blue"
        required={required}
      />
    </div>
  );
}

function AuthShell({
  title,
  subtitle,
  termsHint,
  switchLabel,
  onSwitch,
  children,
}: {
  title: string;
  subtitle: string;
  termsHint: string;
  switchLabel: string;
  onSwitch: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas px-6 pb-tab-safe pt-safe">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        {children}
        <button
          type="button"
          onClick={onSwitch}
          className="mt-6 w-full py-2 text-center text-sm font-medium text-accent-blue"
        >
          {switchLabel}
        </button>
      </div>
      <p className="pb-6 text-center text-[11px] text-muted">{termsHint}</p>
    </div>
  );
}
