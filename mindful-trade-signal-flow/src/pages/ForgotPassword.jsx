import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authEndpoints } from '@/lib/api/endpoints';
import { ArrowLeft, Mail } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError(t('emailRequired'));
      return;
    }
    setLoading(true);
    try {
      await authEndpoints.requestPasswordReset({ email: email.trim() });
      setMessage(t('resetLinkSent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground px-6 pt-12 pb-10">
      <Link
        to="/welcome"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('backToSignIn')}
      </Link>

      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center mb-4">
        <Mail className="h-4 w-4 text-primary-foreground" />
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-1">{t('forgotPassword')}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('enterEmailReset')}
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full h-12 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm outline-none mb-3"
        autoComplete="email"
      />
      {error ? <p className="text-xs text-destructive mb-2">{error}</p> : null}
      {message ? <p className="text-xs text-buy mb-2">{message}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
      >
        {loading ? t('sending') : t('sendResetLink')}
      </button>
    </div>
  );
}
