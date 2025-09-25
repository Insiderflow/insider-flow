"use client";

import { useState } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setMessage('若帳戶存在，我們已寄出重設密碼連結');
      } else {
        const data = await res.json();
        setError(data.error || '請稍後再試');
      }
    } catch (e) {
      setError('網絡錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {message && <div className="bg-white text-green-700 p-2 border border-green-200 rounded text-sm">{message}</div>}
      {error && <div className="bg-white text-red-600 p-2 border border-red-200 rounded text-sm">{error}</div>}
      <label className="block">
        <span className="text-sm text-gray-400">Email</span>
        <input
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
          className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
          placeholder="you@example.com"
          disabled={loading}
        />
      </label>
      <button disabled={loading} className="bg-white text-purple-600 border border-white px-4 py-2 rounded hover:bg-purple-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200 disabled:opacity-50">
        {loading ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  );
}


