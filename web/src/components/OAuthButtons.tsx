"use client";
import { signIn } from 'next-auth/react';

export default function OAuthButtons() {
  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => signIn('google')}
        className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 transition"
      >
        使用 Google 登入
      </button>
    </div>
  );
}


