"use client";

import { useState } from 'react';
import Link from 'next/link';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles } from '@/components/formStyles';
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
        if (res.status === 403 && (data.error || '').toLowerCase().includes('not verified')) {
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
        <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 p-3 rounded text-sm flex items-center justify-between">
          <span>您的電郵尚未驗證。請點擊下方按鈕重新發送驗證電郵。</span>
          <button onClick={resendVerification} disabled={resending || !email}
            className={`ml-3 ${actionStyles('ghost')}`}>
            {resending ? 'Sending…' : 'Resend' }
          </button>
        </div>
      )}
      {resendMsg && (
        <div className="bg-white text-gray-800 p-2.5 rounded border border-gray-200 text-sm">
          {resendMsg}
        </div>
      )}
      {error && (
        <div className="bg-white text-red-600 p-2.5 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm text-gray-400">電郵</span>
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
        <label className="block">
          <span className="text-sm text-gray-400">密碼</span>
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
        <div className="flex items-center justify-between">
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
    </div>
  );
}


