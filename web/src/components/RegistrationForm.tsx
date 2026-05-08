"use client";

import { useState } from 'react';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import Link from 'next/link';
import { textLinkStyles } from '@/components/linkStyles';

export default function RegistrationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (password.length < 8) {
      setError('密碼至少需 8 個字元');
      setIsLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('兩次密碼輸入不一致');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        setSuccessMessage('驗證信已寄出，請去信箱點擊驗證連結後再登入。若沒收到，請檢查垃圾郵件。');
      } else {
        const data = await response.json();
        setError(data.error || '註冊失敗，請稍後再試');
      }
    } catch {
      setError('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="rounded-lg border border-green-500/50 bg-green-900/30 p-3 text-sm text-green-200">
          <p className="font-medium mb-1">GridSend 驗證信已發送</p>
          <p>{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className={fieldLabelStyles()}>
          <span className="w-full sm:w-24 text-gray-400">名稱</span>
          <input
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldControlStyles('md')}
            placeholder="例如：Ken"
            disabled={isLoading}
          />
        </label>
        <label className={fieldLabelStyles()}>
          <span className="w-full sm:w-24 text-gray-400">電郵</span>
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
        <label className={fieldLabelStyles()}>
          <span className="w-full sm:w-24 text-gray-400">密碼</span>
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
        <label className={fieldLabelStyles()}>
          <span className="w-full sm:w-24 text-gray-400">確認密碼</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className={actionStyles('secondary')}
          >
            {isLoading ? '註冊中…' : '建立帳號'}
          </button>
          <p className="text-sm text-gray-400">
            已有帳號？ <Link href="/login" className={textLinkStyles()}>立即登入</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
