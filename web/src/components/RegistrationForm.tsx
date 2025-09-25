"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegistrationFormProps {
  next: string;
}

export default function RegistrationForm({ next }: RegistrationFormProps) {
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
        // Redirect to verify-sent page
        router.push('/verify-sent');
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
          <span className="text-sm text-gray-400">Email</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
            placeholder="Enter your email address"
            disabled={isLoading}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Password</span>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
            placeholder="At least 8 characters"
            disabled={isLoading}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-400">Confirm Password</span>
          <input
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="border border-gray-600 p-2 w-full bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
            placeholder="Retype password"
            disabled={isLoading}
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-white text-purple-600 border border-white px-4 py-2 rounded hover:bg-purple-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Registering...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
