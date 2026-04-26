import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import StateNotice from '@/components/StateNotice';
import { actionStyles } from '@/components/actionStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles, sectionTitleStyles } from '@/components/typographyStyles';
import { backLinkStyles, textLinkStyles } from '@/components/linkStyles';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import WatchlistButton from '@/components/WatchlistButton';

export default async function WatchlistPage() {
  // Read logged-in user from session
  const user = await getSessionUser();
  const userId = user?.id || '';

  // If unauthenticated, render gentle empty state without querying DB
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link 
              href="/insider"
              className={`${backLinkStyles()} mb-4`}
            >
              ← <span className="zh-Hant">返回內幕交易</span>
              <span className="zh-Hans hidden">返回内幕交易</span>
            </Link>
            <h1 className={`${pageTitleStyles()} mb-2`}>
              <span className="zh-Hant">我的關注清單</span>
              <span className="zh-Hans hidden">我的关注清单</span>
            </h1>
            <p className={bodySubtextStyles()}>
              <span className="zh-Hant">請登入以查看您的關注項目</span>
              <span className="zh-Hans hidden">请登录以查看您的关注项目</span>
            </p>
          </div>
          <div className={`${panelSurfaceStyles('lg')} text-center`}>
            <div className="text-gray-400 text-6xl mb-4">🔒</div>
            <p className="text-gray-400">
              <span className="zh-Hant">尚未登入，無法載入關注清單</span>
              <span className="zh-Hans hidden">尚未登录，无法载入关注清单</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated path with DB access, guarded in try/catch
  let watchlist: Array<{
    id: string;
    user_id: string;
    politician_id: string | null;
    company_id: string | null;
    owner_id: string | null;
    watchlist_type: string;
    ticker: string | null;
    created_at: Date;
    Politician: {
      name: string;
      id: string;
      created_at: Date;
      party: string | null;
      chamber: string | null;
      state: string | null;
    } | null;
  }> = [];
  let loadError = false;
  try {
    watchlist = await prisma.userWatchlist.findMany({
      where: { user_id: userId },
      include: { Politician: true },
      orderBy: { created_at: 'desc' },
    });
  } catch {
    // Soft-fail with empty watchlist to avoid page collapse
    watchlist = [];
    loadError = true;
  }

  const groupedWatchlist = {
    politicians: watchlist.filter(w => w.watchlist_type === 'politician'),
    companies: watchlist.filter(w => w.watchlist_type === 'company'),
    owners: watchlist.filter(w => w.watchlist_type === 'owner'),
    stocks: watchlist.filter(w => w.watchlist_type === 'stock'),
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/insider"
            className={`${backLinkStyles()} mb-4`}
          >
            ← <span className="zh-Hant">返回內幕交易</span>
            <span className="zh-Hans hidden">返回内幕交易</span>
          </Link>
            <h1 className={`${pageTitleStyles()} mb-2`}>
            <span className="zh-Hant">我的關注清單</span>
            <span className="zh-Hans hidden">我的关注清单</span>
          </h1>
          <p className={bodySubtextStyles()}>
            <span className="zh-Hant">追蹤您感興趣的政治人物、公司和內部人</span>
            <span className="zh-Hans hidden">追踪您感兴趣的政治人物、公司和内部人</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">政治人物</span>
              <span className="zh-Hans hidden">政治人物</span>
            </h3>
            <p className="text-3xl font-bold text-blue-400">
              {groupedWatchlist.politicians.length}
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">公司</span>
              <span className="zh-Hans hidden">公司</span>
            </h3>
            <p className="text-3xl font-bold text-green-400">
              {groupedWatchlist.companies.length}
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">內部人</span>
              <span className="zh-Hans hidden">内部人</span>
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              {groupedWatchlist.owners.length}
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">股票</span>
              <span className="zh-Hans hidden">股票</span>
            </h3>
            <p className="text-3xl font-bold text-yellow-400">
              {groupedWatchlist.stocks.length}
            </p>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-8">
          {loadError && (
            <StateNotice
              tone="warning"
              title="部分資料載入失敗"
              description="關注清單讀取遇到暫時問題，畫面可能不完整。請稍後重新整理。"
            />
          )}

          {/* Companies */}
          {groupedWatchlist.companies.length > 0 && (
            <div className={panelSurfaceStyles()}>
              <h2 className={`${sectionTitleStyles()} mb-4`}>
                <span className="zh-Hant">關注的公司</span>
                <span className="zh-Hans hidden">关注的公司</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedWatchlist.companies.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.ticker || 'Unknown Company'}</h3>
                        <p className={`${bodySubtextStyles()} text-sm`}>Company ID: {item.company_id}</p>
                      </div>
                      <WatchlistButton 
                        type="company"
                        companyId={item.company_id || undefined}
                        className="text-xs"
                      />
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/insider/company/${item.company_id}`}
                        className={`${textLinkStyles('muted')} text-sm`}
                      >
                        <span className="zh-Hant">查看詳情</span>
                        <span className="zh-Hans hidden">查看详情</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owners */}
          {groupedWatchlist.owners.length > 0 && (
            <div className={panelSurfaceStyles()}>
              <h2 className={`${sectionTitleStyles()} mb-4`}>
                <span className="zh-Hant">關注的內部人</span>
                <span className="zh-Hans hidden">关注的内部人</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedWatchlist.owners.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">Owner ID: {item.owner_id}</h3>
                        <p className={`${bodySubtextStyles()} text-sm`}>Owner Type</p>
                      </div>
                      <WatchlistButton 
                        type="owner"
                        ownerId={item.owner_id || undefined}
                        className="text-xs"
                      />
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/insider/insider/${item.owner_id}`}
                        className={`${textLinkStyles('muted')} text-sm`}
                      >
                        <span className="zh-Hant">查看詳情</span>
                        <span className="zh-Hans hidden">查看详情</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stocks */}
          {groupedWatchlist.stocks.length > 0 && (
            <div className={panelSurfaceStyles()}>
              <h2 className={`${sectionTitleStyles()} mb-4`}>
                <span className="zh-Hant">關注的股票</span>
                <span className="zh-Hans hidden">关注的股票</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedWatchlist.stocks.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.ticker}</h3>
                        <p className={`${bodySubtextStyles()} text-sm`}>
                          <span className="zh-Hant">股票代碼</span>
                          <span className="zh-Hans hidden">股票代码</span>
                        </p>
                      </div>
                      <WatchlistButton 
                        type="stock"
                        ticker={item.ticker || undefined}
                        className="text-xs"
                      />
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/insider?filter=stock-${item.ticker}`}
                        className={`${textLinkStyles('muted')} text-sm`}
                      >
                        <span className="zh-Hant">查看交易</span>
                        <span className="zh-Hans hidden">查看交易</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {watchlist.length === 0 && (
            <StateNotice
              title="您的關注清單目前是空的"
              description="開始關注政治人物、公司、內部人或股票後，這裡會顯示所有追蹤項目。"
              actions={
                <Link
                  href="/insider"
                  className={actionStyles('primary')}
                >
                  <span className="zh-Hant">瀏覽內幕交易</span>
                  <span className="zh-Hans hidden">浏览内幕交易</span>
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}