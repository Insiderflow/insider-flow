import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface SECIssuerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SECIssuerDetailPage({ 
  params, 
  searchParams 
}: SECIssuerDetailPageProps & { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  
  // Get issuer details
  const issuer = await prisma.issuer.findUnique({
    where: { id },
    include: {
      Trade: {
        include: {
          Politician: true
        },
        orderBy: { published_at: 'desc' },
        take: 50
      }
    }
  });

  if (!issuer) {
    notFound();
  }

  // Calculate stats
  const totalTrades = issuer.Trade.length;
  const totalValue = issuer.Trade.reduce((sum, trade) => sum + Number(trade.price || 0), 0);
  const uniquePoliticians = new Set(issuer.Trade.map(t => t.politician_id)).size;
  
  // Get activity breakdown
  const activityStats = issuer.Trade.reduce((acc, trade) => {
    acc[trade.type] = (acc[trade.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get party breakdown
  const partyStats = issuer.Trade.reduce((acc, trade) => {
    const party = trade.Politician.party || 'Unknown';
    acc[party] = (acc[party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {issuer.name}
              </h1>
              <div className="text-lg text-gray-300 mb-2">
                {issuer.ticker && `Ticker: ${issuer.ticker}`}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {issuer.sector && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    {issuer.sector}
                  </span>
                )}
                {issuer.country && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
                    {issuer.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                ${(totalValue / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-400">總交易價值</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {totalTrades.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">總交易數</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {uniquePoliticians.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">涉及政治人物</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {issuer.Trade.length > 0 ? new Date(issuer.Trade[0].published_at || issuer.Trade[0].traded_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-400">最新交易</div>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(activityStats).map(([activity, count]) => (
              <div key={activity} className="bg-gray-800 p-4 rounded-lg">
                <div className="text-xl font-bold text-orange-400">
                  {count}
                </div>
                <div className="text-sm text-gray-400">{activity} 交易</div>
              </div>
            ))}
          </div>

          {/* Party Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(partyStats).map(([party, count]) => (
              <div key={party} className="bg-gray-800 p-4 rounded-lg">
                <div className="text-xl font-bold text-orange-400">
                  {count}
                </div>
                <div className="text-sm text-gray-400">{party} 黨</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">最近交易</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 font-semibold text-gray-300">政治人物</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">價值</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">股數</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-300">類型</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-300">政黨</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">日期</th>
                </tr>
              </thead>
              <tbody>
                {issuer.Trade.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-2">
                      <Link 
                        href={`/politicians/${trade.politician_id}`}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {trade.Politician.name}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-300">
                      ${(Number(trade.price || 0) / 1000).toLocaleString()}K
                    </td>
                    <td className="py-3 px-2 text-right text-gray-300">
                      {Number(trade.size_max || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trade.type === 'Buy' ? 'bg-green-500 text-white' :
                        trade.type === 'Sell' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        trade.Politician.party === 'Republican' ? 'bg-red-500 text-white' :
                        trade.Politician.party === 'Democratic' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {trade.Politician.party || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-xs text-gray-400">
                      {new Date(trade.published_at || trade.traded_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}