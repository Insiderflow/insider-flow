"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles } from '@/components/formStyles';

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
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className={fieldControlStyles('md')} placeholder="At least 8 characters"/>
      </label>
      <label className="block">
        <span className="text-sm text-gray-400">Confirm Password</span>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className={fieldControlStyles('md')} placeholder="Retype password"/>
      </label>
      <button disabled={loading} className={actionStyles('secondary')}>{loading ? 'Saving...' : 'Reset Password'}</button>
    </form>
  );
}


