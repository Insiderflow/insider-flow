"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { token: string }

export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      if (res.ok) {
        router.replace('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <div className="bg-white text-red-600 p-2 border border-red-200 rounded text-sm">{error}</div>}
      <label className="block">
        <span className="text-sm text-gray-400">New Password</span>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" placeholder="At least 8 characters"/>
      </label>
      <label className="block">
        <span className="text-sm text-gray-400">Confirm Password</span>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" placeholder="Retype password"/>
      </label>
      <button disabled={loading} className="bg-white text-purple-600 border border-white px-4 py-2 rounded hover:bg-purple-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200 disabled:opacity-50">{loading ? 'Saving...' : 'Reset Password'}</button>
    </form>
  );
}


