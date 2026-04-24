import Link from 'next/link';
import { backLinkStyles } from '@/components/linkStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';

export const dynamic = 'force-dynamic';

// Temporarily disable SEC data functionality in production
export default async function SECDataPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className={`${pageTitleStyles()} mb-4`}>SEC Data</h1>
        <p className={`${bodySubtextStyles()} mb-4`}>
          This feature is temporarily unavailable in production.
        </p>
        <Link href="/insider" className={backLinkStyles()}>
          ← Back to Insider Trading
        </Link>
      </div>
    </div>
  );
}