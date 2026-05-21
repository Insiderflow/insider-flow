import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import WatchlistButton from '@/components/WatchlistButton';
import { Decimal } from '@prisma/client/runtime/library';
import { translateTitle } from '@/lib/titleI18n';
import { backLinkStyles, textLinkStyles } from '@/components/linkStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles, sectionTitleStyles } from '@/components/typographyStyles';
import { badgeStyles } from '@/components/badgeStyles';
import { tableBodyStyles, tableHeaderCellStyles, tableHeaderStyles, tableRowStyles, tableWrapperStyles } from '@/components/tableStyles';

interface InsiderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InsiderPage({ params }: InsiderPageProps) {
  const { id } = await params;
  let insider: {
    id: string;
    name: string;
    title: string | null;
    isInstitution: boolean;
    transactions: Array<{
      id: string;
      transactionDate: Date;
      tradeDate: Date;
      transactionType: string;
      quantity: string;
      sharesHeld: string;
      owned: string;
      value: string;
      valueNumeric: Decimal | null;
      lastPrice: Decimal | null;
      company: {
        id: string;
        ticker: string;
        name: string;
      };
    }>;
  } | null = null;
  try {
    insider = await prisma.openInsiderOwner.findUnique({
      where: { id },
      include: {
        transactions: {
          include: { company: true },
          orderBy: { transactionDate: 'desc' },
          take: 100,
        },
      },
    });
  } catch {
    insider = null;
  }

  if (!insider) {
    notFound();
  }

  // Calculate stats
  const totalTransactions = insider.transactions.length;
  const totalValue = insider.transactions.reduce((sum: number, t) => 
    sum + (t.valueNumeric ? Number(t.valueNumeric) : 0), 0
  );
  const uniqueCompanies = new Set(insider.transactions.map((t) => t.company.id)).size;

  // Calculate purchase vs sale stats
  const purchases = insider.transactions.filter((t) => t.transactionType.includes('Purchase'));
  const sales = insider.transactions.filter((t) => t.transactionType.includes('Sale'));
  const purchaseValue = purchases.reduce((sum: number, t) => 
    sum + (t.valueNumeric ? Number(t.valueNumeric) : 0), 0
  );
  const saleValue = sales.reduce((sum: number, t) => 
    sum + (t.valueNumeric ? Number(t.valueNumeric) : 0), 0
  );

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
          <span className="ko hidden">내부자 거래로 돌아가기</span>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`${pageTitleStyles()} mb-2`}>{insider.name}</h1>
            </div>
            <WatchlistButton 
              type="owner"
              ownerId={insider.id}
            />
          </div>
          <div className={`flex flex-wrap gap-4 ${bodySubtextStyles()}`}>
            {insider.title && (
              <p className="text-lg">
                <span className="zh-Hant">職位：</span>
                <span className="zh-Hans hidden">职位：</span>
          <span className="ko hidden">직책:</span>
                <span className="text-blue-400">
                  <span className="zh-Hant">{translateTitle(insider.title, 'hant')}</span>
                  <span className="zh-Hans hidden">{translateTitle(insider.title, 'hans')}</span>
          <span className="ko hidden">{translateTitle(insider.title, 'ko')}</span>
                </span>
              </p>
            )}
            <p className="text-lg">
              <span className="zh-Hant">類型：</span>
              <span className="zh-Hans hidden">类型：</span>
          <span className="ko hidden">유형:</span>
              <span className="text-purple-400">
                {insider.isInstitution ? 
                  <>
                    <span className="zh-Hant">機構投資者</span>
                    <span className="zh-Hans hidden">机构投资者</span>
                    <span className="ko hidden">기관 투자자</span>
                  </>
                  : 
                  <>
                    <span className="zh-Hant">個人</span>
                    <span className="zh-Hans hidden">个人</span>
                    <span className="ko hidden">개인</span>
                  </>
                }
              </span>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">總交易數</span>
              <span className="zh-Hans hidden">总交易数</span>
          <span className="ko hidden">총 거래 수</span>
            </h3>
            <p className="text-3xl font-bold text-blue-400">
              {totalTransactions.toLocaleString()}
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">總價值</span>
              <span className="zh-Hans hidden">总价值</span>
          <span className="ko hidden">총 가치</span>
            </h3>
            <p className="text-3xl font-bold text-green-400">
              ${(totalValue / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">涉及公司</span>
              <span className="zh-Hans hidden">涉及公司</span>
          <span className="ko hidden">관련 회사</span>
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              {uniqueCompanies}
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className={`text-lg font-semibold mb-2 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">淨交易</span>
              <span className="zh-Hans hidden">净交易</span>
          <span className="ko hidden">순 거래</span>
            </h3>
            <p className={`text-3xl font-bold ${purchaseValue > saleValue ? 'text-green-400' : 'text-red-400'}`}>
              ${((purchaseValue - saleValue) / 1000000).toFixed(1)}M
            </p>
            <p className={`text-sm mt-1 ${bodySubtextStyles()}`}>
              <span className="zh-Hant">買入：</span>
              <span className="zh-Hans hidden">买入：</span>
          <span className="ko hidden">매수:</span>
              ${(purchaseValue / 1000000).toFixed(1)}M | 
              <span className="zh-Hant">賣出：</span>
              <span className="zh-Hans hidden">卖出：</span>
          <span className="ko hidden">매도:</span>
              ${(saleValue / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className={`${panelSurfaceStyles()} overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className={sectionTitleStyles()}>
              <span className="zh-Hant">最近交易</span>
              <span className="zh-Hans hidden">最近交易</span>
          <span className="ko hidden">최근 거래</span>
            </h2>
          </div>
          <div className={tableWrapperStyles()}>
            <table className="min-w-full divide-y divide-gray-700">
              <thead className={tableHeaderStyles()}>
                <tr>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">申報日期</span>
                    <span className="zh-Hans hidden">申报日期</span>
          <span className="ko hidden">신고일</span>
                  </th>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">交易日期</span>
                    <span className="zh-Hans hidden">交易日期</span>
          <span className="ko hidden">거래일</span>
                  </th>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">公司</span>
                    <span className="zh-Hans hidden">公司</span>
          <span className="ko hidden">회사</span>
                  </th>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">股票代碼</span>
                    <span className="zh-Hans hidden">股票代码</span>
          <span className="ko hidden">티커</span>
                  </th>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">交易類型</span>
                    <span className="zh-Hans hidden">交易类型</span>
          <span className="ko hidden">거래 유형</span>
                  </th>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">價格</span>
                    <span className="zh-Hans hidden">价格</span>
          <span className="ko hidden">가격</span>
                  </th>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">數量</span>
                    <span className="zh-Hans hidden">数量</span>
          <span className="ko hidden">수량</span>
                  </th>
                  <th className={tableHeaderCellStyles('md')}>
                    <span className="zh-Hant">交易價值</span>
                    <span className="zh-Hans hidden">交易价值</span>
          <span className="ko hidden">거래 가치</span>
                  </th>
                </tr>
              </thead>
              <tbody className={tableBodyStyles()}>
                {insider.transactions.map((transaction) => (
                  <tr key={transaction.id} className={tableRowStyles()}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <Link 
                        href={`/insider/company/${transaction.company.id}`}
                        className={textLinkStyles('muted')}
                      >
                        {transaction.company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {transaction.company.ticker}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className={badgeStyles(
                        transaction.transactionType.includes('Purchase') ? 'success' : 'danger',
                        'sm'
                      )}>
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

