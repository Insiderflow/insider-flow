import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface SECPoliticianDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SECPoliticianDetailPage({ 
  params, 
  searchParams 
}: SECPoliticianDetailPageProps & { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  
  // Get politician details
  const politician = await prisma.politician.findUnique({
    where: { id },
    include: {
      Trade: {
        include: {
          Issuer: true
        },
        orderBy: { published_at: 'desc' },
        take: 50
      }
    }
  });

  if (!politician) {
    notFound();
  }

  // Calculate stats
  const totalTrades = politician.Trade.length;
  const totalValue = politician.Trade.reduce((sum, trade) => sum + Number(trade.price || 0), 0);
  const uniqueIssuers = new Set(politician.Trade.map(t => t.issuer_id)).size;
  
  // Get activity breakdown
  const activityStats = politician.Trade.reduce((acc, trade) => {
    acc[trade.type] = (acc[trade.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get sector breakdown
  const sectorStats = politician.Trade.reduce((acc, trade) => {
    const sector = trade.Issuer.sector || 'Unknown';
    acc[sector] = (acc[sector] || 0) + 1;
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
                {politician.name}
              </h1>
              <div className="text-lg text-gray-300 mb-2">
                {politician.party && `政黨: ${politician.party}`}
                {politician.chamber && ` | 議院: ${politician.chamber}`}
                {politician.state && ` | 州: ${politician.state}`}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {politician.party && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    politician.party === 'Republican' ? 'bg-red-500 text-white' :
                    politician.party === 'Democratic' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {politician.party}
                  </span>
                )}
                {politician.chamber && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
                    {politician.chamber}
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
                {uniqueIssuers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">投資公司數</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {politician.Trade.length > 0 ? new Date(politician.Trade[0].published_at || politician.Trade[0].traded_at).toLocaleDateString() : 'N/A'}
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

          {/* Sector Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(sectorStats).map(([sector, count]) => (
              <div key={sector} className="bg-gray-800 p-4 rounded-lg">
                <div className="text-xl font-bold text-orange-400">
                  {count}
                </div>
                <div className="text-sm text-gray-400">{sector}</div>
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
                  <th className="text-left py-3 px-2 font-semibold text-gray-300">公司</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">價值</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">股數</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-300">類型</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-300">行業</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">日期</th>
                </tr>
              </thead>
              <tbody>
                {politician.Trade.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-2">
                      <Link 
                        href={`/issuers/${trade.issuer_id}`}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {trade.Issuer.name}
                      </Link>
                      {trade.Issuer.ticker && (
                        <div className="text-xs text-gray-400">({trade.Issuer.ticker})</div>
                      )}
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
                    <td className="py-3 px-2 text-center text-gray-300">
                      {trade.Issuer.sector || 'N/A'}
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