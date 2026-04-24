import Link from 'next/link';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { sectionTitleStyles } from '@/components/typographyStyles';
export const dynamic = 'force-dynamic';

export default function VerifySentPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Link href="/" className={`max-w-md mx-auto ${panelSurfaceStyles()} text-center block focus:outline-none focus:ring-2 focus:ring-blue-500`}>
        <h1 className={sectionTitleStyles()}>謝謝 你的注册<br/>馬上 體驗內幕消息</h1>
      </Link>
    </div>
  );
}


