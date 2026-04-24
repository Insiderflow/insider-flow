"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles } from '@/components/formStyles';

export default function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Go to success page with instruction to login
        router.push('/register-success');
      } else {
        // Handle error response
        const data = await response.json();
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-white text-red-600 p-2.5 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm text-gray-400">電郵</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={fieldControlStyles('md')}
            placeholder="請輸入您的電郵"
            disabled={isLoading}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">密碼</span>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={fieldControlStyles('md')}
            placeholder="至少 8 個字元"
            disabled={isLoading}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">確認密碼</span>
          <input
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={fieldControlStyles('md')}
            placeholder="請再次輸入密碼"
            disabled={isLoading}
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className={actionStyles('secondary')}
        >
          {isLoading ? '註冊中…' : '繼續'}
        </button>
      </form>
    </div>
  );
}
