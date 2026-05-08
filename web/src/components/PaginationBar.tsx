import Link from 'next/link';
import { actionStyles } from '@/components/actionStyles';

type PaginationBarProps = {
  page: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  /** When set, users can jump to any page by number (keeps query string in sync). */
  getPageHref?: (pageNum: number) => string;
  className?: string;
};

/** Build a compact list of page numbers and ellipses for the pager. */
function getPaginationItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 1) return [1];
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const items: Array<number | 'ellipsis'> = [];
  items.push(1);
  if (left > 2) items.push('ellipsis');
  for (let i = left; i <= right; i++) items.push(i);
  if (right < total - 1) items.push('ellipsis');
  items.push(total);
  return items;
}

export default function PaginationBar({
  page,
  totalPages,
  prevHref,
  nextHref,
  getPageHref,
  className = '',
}: PaginationBarProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const pageItems = getPaginationItems(page, totalPages);

  const pageLinkBase =
    'inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border px-2 py-1.5 text-sm transition-colors';
  const pageLinkInactive = 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500 hover:bg-gray-700';
  const pageLinkActive = 'border-blue-500 bg-blue-950/40 text-white ring-1 ring-blue-500/50';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-xs text-gray-300">
          <span className="zh-Hant">第 {page} 頁，共 {totalPages} 頁</span>
          <span className="zh-Hans hidden">第 {page} 页，共 {totalPages} 页</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasPrev ? (
            <Link href={prevHref} className={actionStyles('secondary')}>
              <span className="zh-Hant">上一頁</span>
              <span className="zh-Hans hidden">上一页</span>
            </Link>
          ) : (
            <span
              className={`${actionStyles('secondary')} bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed hover:bg-gray-700 hover:text-gray-400`}
            >
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
            <span
              className={`${actionStyles('secondary')} bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed hover:bg-gray-700 hover:text-gray-400`}
            >
              <span className="zh-Hant">下一頁</span>
              <span className="zh-Hans hidden">下一页</span>
            </span>
          )}
        </div>
      </div>

      {getPageHref && totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:justify-end">
          <span className="text-xs text-gray-500 mr-1 shrink-0">
            <span className="zh-Hant">頁碼</span>
            <span className="zh-Hans hidden">页码</span>
          </span>
          {pageItems.map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-1 text-gray-500 select-none">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={getPageHref(item)}
                scroll={true}
                className={`${pageLinkBase} ${item === page ? pageLinkActive : pageLinkInactive}`}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}
