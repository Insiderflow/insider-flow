import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function InstitutionalPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">機構投資者</h1>
          <p className="text-gray-400">查看所有機構投資者的持股詳情和投資活動</p>
        </div>

        {/* Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🏢</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">機構投資者數據庫</h2>
              <p className="text-gray-300 mb-4">
                此頁面將顯示所有機構投資者的持股數據，包括對沖基金、養老基金、保險公司等。
              </p>
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-300 mb-2">📊 數據來源</h3>
                <p className="text-gray-300 text-sm mb-2">
                  數據來自 SEC 13F-HR 申報，包括：
                </p>
                <ul className="text-gray-300 text-sm space-y-1 ml-4">
                  <li>• Berkshire Hathaway (巴菲特)</li>
                  <li>• BlackRock</li>
                  <li>• Vanguard</li>
                  <li>• State Street</li>
                  <li>• 其他大型機構投資者</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Managers */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">📈 主要機構投資者</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-2">Berkshire Hathaway</h3>
              <p className="text-gray-300 text-sm mb-2">CIK: 0001067983</p>
              <p className="text-gray-400 text-sm">巴菲特投資公司</p>
              <div className="mt-2">
                <span className="px-2 py-1 rounded-full text-xs bg-green-500 text-white">評級: 5/5</span>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-2">BlackRock Inc</h3>
              <p className="text-gray-300 text-sm mb-2">CIK: 0001364742</p>
              <p className="text-gray-400 text-sm">全球最大資產管理公司</p>
              <div className="mt-2">
                <span className="px-2 py-1 rounded-full text-xs bg-blue-500 text-white">評級: 5/5</span>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-2">Vanguard Group</h3>
              <p className="text-gray-300 text-sm mb-2">CIK: 0000102909</p>
              <p className="text-gray-400 text-sm">指數基金先驅</p>
              <div className="mt-2">
                <span className="px-2 py-1 rounded-full text-xs bg-purple-500 text-white">評級: 5/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-white mb-2">投資組合分析</h3>
            <p className="text-gray-300 text-sm mb-4">
              分析機構投資者的投資組合集中度、行業分布、持股變化趨勢
            </p>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• 投資組合集中度分析</li>
              <li>• 行業分布統計</li>
              <li>• 持股變化追蹤</li>
              <li>• 投資風格分類</li>
            </ul>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-bold text-white mb-2">實時數據</h3>
            <p className="text-gray-300 text-sm mb-4">
              基於 SEC 13F 申報的季度更新，提供最新的機構持股數據
            </p>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• 季度申報更新</li>
              <li>• 持股變化分析</li>
              <li>• 投資活動追蹤</li>
              <li>• 績效指標計算</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🚀 快速操作</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/sec-data" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              查看 SEC 13F 數據
            </Link>
            <Link 
              href="/politicians" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              查看政治人物交易
            </Link>
            <Link 
              href="/issuers" 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              查看公司詳情
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}