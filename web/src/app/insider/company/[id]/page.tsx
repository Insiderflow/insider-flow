import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import WatchlistButton from '@/components/WatchlistButton';

interface CompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  let company: any = null;
  try {
    company = await prisma.openInsiderCompany.findUnique({
      where: { id },
      include: {
        transactions: {
          include: { owner: true },
          orderBy: { transactionDate: 'desc' },
          take: 100,
        },
      },
    });
  } catch (_e) {
    company = null;
  }

  if (!company) {
    notFound();
  }

  // Calculate stats
  const totalTransactions = company.transactions.length;
  const totalValue = company.transactions.reduce((sum, t) => 
    sum + (t.valueNumeric ? Number(t.valueNumeric) : 0), 0
  );
  const uniqueInsiders = new Set(company.transactions.map(t => t.owner.id)).size;

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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
              <p className="text-gray-300 text-lg">
                <span className="zh-Hant">股票代碼：</span>
                <span className="zh-Hans hidden">股票代码：</span>
                <span className="font-mono text-blue-400">{company.ticker}</span>
              </p>
            </div>
            <div className="flex space-x-3">
              <WatchlistButton 
                type="company"
                companyId={company.id}
                className="ml-4"
              />
              <WatchlistButton 
                type="stock"
                ticker={company.ticker}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">總交易數</span>
              <span className="zh-Hans hidden">总交易数</span>
            </h3>
            <p className="text-3xl font-bold text-blue-400">
              {totalTransactions.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">總價值</span>
              <span className="zh-Hans hidden">总价值</span>
            </h3>
            <p className="text-3xl font-bold text-green-400">
              ${(totalValue / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">涉及內部人</span>
              <span className="zh-Hans hidden">涉及内部人</span>
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              {uniqueInsiders}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">
              <span className="zh-Hant">最近交易</span>
              <span className="zh-Hans hidden">最近交易</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">申報日期</span>
                    <span className="zh-Hans hidden">申报日期</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">交易日期</span>
                    <span className="zh-Hans hidden">交易日期</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">內部人</span>
                    <span className="zh-Hans hidden">内部人</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">職位</span>
                    <span className="zh-Hans hidden">职位</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">交易類型</span>
                    <span className="zh-Hans hidden">交易类型</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">價格</span>
                    <span className="zh-Hans hidden">价格</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">數量</span>
                    <span className="zh-Hans hidden">数量</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">交易價值</span>
                    <span className="zh-Hans hidden">交易价值</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {company.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.tradeDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <Link 
                        href={`/insider/insider/${transaction.owner.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
                      >
                        {transaction.owner.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {transaction.owner.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.lastPrice ? `$${Number(transaction.lastPrice).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.valueNumeric ? `$${Number(transaction.valueNumeric).toLocaleString()}` : transaction.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

