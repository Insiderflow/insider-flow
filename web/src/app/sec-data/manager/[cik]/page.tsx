import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Temporarily disable SEC data functionality in production
export default async function ManagerPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Manager Details</h1>
        <p className="text-gray-300 mb-4">
          This feature is temporarily unavailable in production.
        </p>
        <Link href="/sec-data" className="text-blue-400 hover:text-blue-300">
          ← Back to SEC Data
        </Link>
      </div>
    </div>
  );
}