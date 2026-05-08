import Link from 'next/link';
import { actionStyles } from '@/components/actionStyles';

type PaginationBarProps = {
  page: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  className?: string;
};

export default function PaginationBar({ page, totalPages, prevHref, nextHref, className = '' }: PaginationBarProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${className}`}>
      <div className="text-xs text-gray-300">
        <span className="zh-Hant">第 {page} 頁，共 {totalPages} 頁</span>
        <span className="zh-Hans hidden">第 {page} 页，共 {totalPages} 页</span>
      </div>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link href={prevHref} className={actionStyles('secondary')}>
            <span className="zh-Hant">上一頁</span>
            <span className="zh-Hans hidden">上一页</span>
          </Link>
        ) : (
          <span className={`${actionStyles('secondary')} bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed hover:bg-gray-700 hover:text-gray-400`}>
            <span className="zh-Hant">上一頁</span>
            <span className="zh-Hans hidden">上一页</span>
          </span>
        )}
        {hasNext ? (
          <Link href={nextHref} className={actionStyles('secondary')}>
            <span className="zh-Hant">下一頁</span>
            <span className="zh-Hans hidden">下一页</span>
          </Link>
        ) : (
          <span className={`${actionStyles('secondary')} bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed hover:bg-gray-700 hover:text-gray-400`}>
            <span className="zh-Hant">下一頁</span>
            <span className="zh-Hans hidden">下一页</span>
          </span>
        )}
      </div>
    </div>
  );
}
