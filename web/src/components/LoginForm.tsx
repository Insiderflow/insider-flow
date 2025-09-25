"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
        // Navigate and force a refresh so the server layout re-reads session
        router.replace(next);
        router.refresh();
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
    } catch (err) {
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
    } catch (_e) {
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
            className="ml-3 inline-flex items-center px-3 py-1.5 rounded bg-yellow-600 text-white hover:bg-yellow-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60">
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
          <span className="text-sm text-gray-400">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </label>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-white text-purple-600 border border-white px-4 py-2 rounded hover:bg-purple-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          <a href="/forgot-password" className="text-blue-300 hover:text-blue-100 underline text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200">Forgot Password?</a>
        </div>
      </form>
    </div>
  );
}


