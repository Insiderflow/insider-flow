"use client";

import { useState } from 'react';
import Link from 'next/link';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { textLinkStyles } from '@/components/linkStyles';

interface LoginFormProps {
  next: string;
}

export default function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        // Use window.location for more reliable redirect on mobile
        // Small delay to ensure cookie is set
        setTimeout(() => {
          window.location.href = next;
        }, 100);
      } else {
        const data = await res.json();
        if ((data.error || '').toLowerCase().includes('verify')) {
          setUnverified(true);
          setError('');
        } else {
          setError(data.error || 'Login failed');
          setUnverified(false);
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setResendMsg('');
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setResendMsg('Verification email sent. Please check your inbox.');
      } else {
        const data = await res.json();
        setResendMsg(data.error || 'Failed to resend. Try again later.');
      }
    } catch {
      setResendMsg('Network error. Try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4">
      {unverified && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-900/30 p-3 text-sm text-yellow-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>請先驗證信箱，再登入帳號。</span>
            <button onClick={resendVerification} disabled={resending || !email} className={actionStyles('ghost')}>
              {resending ? '寄送中…' : '重寄驗證信'}
            </button>
          </div>
        </div>
      )}
      {resendMsg && (
        <div className="rounded-lg border border-green-500/50 bg-green-900/30 p-3 text-sm text-green-200">
          {resendMsg}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className={fieldLabelStyles()}>
          <span className="w-full sm:w-24 text-gray-400">電郵</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={fieldControlStyles('md')}
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </label>
        <label className={fieldLabelStyles()}>
          <span className="w-full sm:w-24 text-gray-400">密碼</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={fieldControlStyles('md')}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className={actionStyles('secondary')}
          >
            {isLoading ? '登入中…' : '登入'}
          </button>
          <Link href="/forgot-password" className={`${textLinkStyles()} text-sm`}>忘記密碼？</Link>
        </div>
      </form>
      <p className="text-xs text-gray-400">
        By continuing, you agree to our{" "}
        <Link href="/terms" className={textLinkStyles()}>
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className={textLinkStyles()}>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}


