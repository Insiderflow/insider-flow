import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authEndpoints } from '@/lib/api/endpoints';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setMessage('');
    if (!token) {
      setError(t('missingResetToken'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordMin8'));
      return;
    }
    if (password !== confirm) {
      setError(t('passwordsNotMatch'));
      return;
    }
    setLoading(true);
    try {
      await authEndpoints.resetPassword({ token, new_password: password });
      setMessage(t('passwordUpdated'));
      setTimeout(() => navigate('/welcome', { replace: true }), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('resetFailed'));
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
        <KeyRound className="h-4 w-4 text-primary-foreground" />
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-1">{t('setNewPassword')}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('chooseStrongPassword')}
      </p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('newPassword')}
        className="w-full h-12 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm outline-none mb-3"
        autoComplete="new-password"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t('confirmPassword')}
        className="w-full h-12 rounded-xl bg-secondary/40 border border-border/50 px-3 text-sm outline-none mb-3"
        autoComplete="new-password"
      />
      {error ? <p className="text-xs text-destructive mb-2">{error}</p> : null}
      {message ? <p className="text-xs text-buy mb-2">{message}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
      >
        {loading ? t('saving') : t('updatePassword')}
      </button>
    </div>
  );
}
