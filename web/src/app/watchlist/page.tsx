import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

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
              className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
            >
              ← <span className="zh-Hant">返回內幕交易</span>
              <span className="zh-Hans hidden">返回内幕交易</span>
            </Link>
            <h1 className="text-4xl font-bold mb-2">
              <span className="zh-Hant">我的關注清單</span>
              <span className="zh-Hans hidden">我的关注清单</span>
            </h1>
            <p className="text-gray-300">
              <span className="zh-Hant">請登入以查看您的關注項目</span>
              <span className="zh-Hans hidden">请登录以查看您的关注项目</span>
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-12 text-center">
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
  let watchlist: Array<any> = [];
  try {
    watchlist = await prisma.userWatchlist.findMany({
      where: { user_id: userId },
      include: { Politician: true, Company: true, Owner: true },
      orderBy: { created_at: 'desc' },
    });
  } catch (e) {
    // Soft-fail with empty watchlist to avoid page collapse
    watchlist = [];
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
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← <span className="zh-Hant">返回內幕交易</span>
            <span className="zh-Hans hidden">返回内幕交易</span>
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            <span className="zh-Hant">我的關注清單</span>
            <span className="zh-Hans hidden">我的关注清单</span>
          </h1>
          <p className="text-gray-300">
            <span className="zh-Hant">追蹤您感興趣的政治人物、公司和內部人</span>
            <span className="zh-Hans hidden">追踪您感兴趣的政治人物、公司和内部人</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">政治人物</span>
              <span className="zh-Hans hidden">政治人物</span>
            </h3>
            <p className="text-3xl font-bold text-blue-400">
              {groupedWatchlist.politicians.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">公司</span>
              <span className="zh-Hans hidden">公司</span>
            </h3>
            <p className="text-3xl font-bold text-green-400">
              {groupedWatchlist.companies.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">內部人</span>
              <span className="zh-Hans hidden">内部人</span>
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              {groupedWatchlist.owners.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
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
          {/* Companies */}
          {groupedWatchlist.companies.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">
                <span className="zh-Hant">關注的公司</span>
                <span className="zh-Hans hidden">关注的公司</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedWatchlist.companies.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.Company?.name}</h3>
                        <p className="text-gray-300 text-sm">{item.Company?.ticker}</p>
                      </div>
                      <WatchlistButton 
                        type="company"
                        companyId={item.company_id}
                        className="text-xs"
                      />
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/insider/company/${item.company_id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
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
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">
                <span className="zh-Hant">關注的內部人</span>
                <span className="zh-Hans hidden">关注的内部人</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedWatchlist.owners.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.Owner?.name}</h3>
                        <p className="text-gray-300 text-sm">{item.Owner?.title}</p>
                      </div>
                      <WatchlistButton 
                        type="owner"
                        ownerId={item.owner_id}
                        className="text-xs"
                      />
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/insider/insider/${item.owner_id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
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
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">
                <span className="zh-Hant">關注的股票</span>
                <span className="zh-Hans hidden">关注的股票</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedWatchlist.stocks.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.ticker}</h3>
                        <p className="text-gray-300 text-sm">
                          <span className="zh-Hant">股票代碼</span>
                          <span className="zh-Hans hidden">股票代码</span>
                        </p>
                      </div>
                      <WatchlistButton 
                        type="stock"
                        ticker={item.ticker}
                        className="text-xs"
                      />
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/insider?filter=stock-${item.ticker}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
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
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">
                <span className="zh-Hant">您的關注清單是空的</span>
                <span className="zh-Hans hidden">您的关注清单是空的</span>
              </h3>
              <p className="text-gray-400 mb-6">
                <span className="zh-Hant">開始關注您感興趣的政治人物、公司和內部人</span>
                <span className="zh-Hans hidden">开始关注您感兴趣的政治人物、公司和内部人</span>
              </p>
              <Link 
                href="/insider"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors duration-200"
              >
                <span className="zh-Hant">瀏覽內幕交易</span>
                <span className="zh-Hans hidden">浏览内幕交易</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}