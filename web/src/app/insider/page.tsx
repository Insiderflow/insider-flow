import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ClearFiltersButton from '@/components/ClearFiltersButton';
import AutocompleteInput from '@/components/AutocompleteInput';
import LoadingWrapper from '@/components/LoadingWrapper';
import { StatsCardSkeleton, TableSkeleton } from '@/components/SkeletonLoader';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import { translateTitle } from '@/lib/titleI18n';
import { translateTxnType } from '@/lib/transactionTypeI18n';
import FilterCategories from './FilterCategories';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import { redirect } from 'next/navigation';
import ExportButton from '@/components/ExportButton';
import TableRowSkeleton from '@/components/TableRowSkeleton';

// SortableHeader component
function SortableHeader({ 
  field, 
  currentSort, 
  currentOrder, 
  label, 
  labelHans,
  searchParams
}: { 
  field: string; 
  currentSort: string; 
  currentOrder: string; 
  label: string; 
  labelHans: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const isActive = currentSort === field;
  const newOrder = isActive && currentOrder === 'desc' ? 'asc' : 'desc';
  
  // Preserve existing query parameters
  const params = new URLSearchParams();
  if (searchParams.qc) params.set('qc', String(searchParams.qc));
  if (searchParams.qo) params.set('qo', String(searchParams.qo));
  if (searchParams.type) params.set('type', String(searchParams.type));
  if (searchParams.institution) params.set('institution', String(searchParams.institution));
  if (searchParams.page) params.set('page', String(searchParams.page));
  params.set('sort', field);
  params.set('order', newOrder);
  
  return (
    <Link 
      href={`/insider?${params.toString()}`}
      className="flex items-center space-x-1 hover:text-white transition-colors duration-200"
    >
      <span className="zh-Hant">{label}</span>
      <span className="zh-Hans hidden">{labelHans}</span>
      {isActive && (
        <span className="text-blue-400">
          {currentOrder === 'desc' ? '↓' : '↑'}
        </span>
      )}
      {!isActive && (
        <span className="text-gray-500 opacity-50">↕</span>
      )}
    </Link>
  );
}

export const dynamic = 'force-dynamic';

export default async function InsiderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // SSR guard (middleware also handles it)
  const me = await getCurrentUserWithTier();
  if (!isPaid(me)) {
    redirect('/upgrade?reason=paid_required');
  }
  const sp = await searchParams;
  const pageSize = 50;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const allowedSort = new Set(['transactionDate', 'tradeDate', 'valueNumeric', 'lastPrice']);
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'transactionDate';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'transactionDate';
  const qCompany = typeof sp.qc === 'string' ? sp.qc : '';
  const qOwner = typeof sp.qo === 'string' ? sp.qo : '';
  const typeFilter = typeof sp.type === 'string' ? sp.type : '';
  const isInstitutionFilter = typeof sp.institution === 'string' ? sp.institution : '';
  const filterCategory = typeof sp.filter === 'string' ? sp.filter : '';

  const orderBy: Record<string, 'asc' | 'desc'> = {};
  orderBy[sortKey] = order;

  type TransactionWhere = {
    company?: { is: { name: { contains: string; mode: 'insensitive' } } };
    owner?: { 
      is: { 
        name?: { contains: string; mode: 'insensitive' };
        isInstitution?: boolean;
        title?: { contains: string; mode: 'insensitive' };
      } 
    };
    transactionType?: string | { in: string[] };
    lastPrice?: { lt?: number; gte?: number };
    valueNumeric?: { gte?: number };
    transactionDate?: { gte?: Date };
  };
  const where: TransactionWhere = {};
  
  // Apply filter categories
  switch (filterCategory) {
    // Top Officer Purchases
    case 'top-officer-purchases-today':
      where.transactionType = 'P - Purchase';
      where.owner = { is: { title: { contains: 'Officer', mode: 'insensitive' } } };
      where.transactionDate = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
      break;
    case 'top-officer-purchases-week':
      where.transactionType = 'P - Purchase';
      where.owner = { is: { title: { contains: 'Officer', mode: 'insensitive' } } };
      where.transactionDate = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      break;
    case 'top-officer-purchases-month':
      where.transactionType = 'P - Purchase';
      where.owner = { is: { title: { contains: 'Officer', mode: 'insensitive' } } };
      where.transactionDate = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      break;
    
    // Top Insider Purchases
    case 'top-insider-purchases-today':
      where.transactionType = 'P - Purchase';
      where.transactionDate = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
      break;
    case 'top-insider-purchases-week':
      where.transactionType = 'P - Purchase';
      where.transactionDate = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      break;
    case 'top-insider-purchases-month':
      where.transactionType = 'P - Purchase';
      where.transactionDate = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      break;
    
    // Top Insider Sales
    case 'top-insider-sales-today':
      where.transactionType = { in: ['S - Sale', 'S - Sale+OE'] };
      where.transactionDate = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
      break;
    case 'top-insider-sales-week':
      where.transactionType = { in: ['S - Sale', 'S - Sale+OE'] };
      where.transactionDate = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      break;
    case 'top-insider-sales-month':
      where.transactionType = { in: ['S - Sale', 'S - Sale+OE'] };
      where.transactionDate = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      break;
    
    // High Value Trades
    case 'high-value-purchases':
      where.transactionType = 'P - Purchase';
      where.valueNumeric = { gte: 25000 };
      break;
    case 'high-value-sales':
      where.transactionType = { in: ['S - Sale', 'S - Sale+OE'] };
      where.valueNumeric = { gte: 100000 };
      break;
    
    // Special Categories
    case 'penny-stock':
      where.lastPrice = { lt: 5.0 };
      break;
    case 'ceo-cfo-purchases':
      where.transactionType = 'P - Purchase';
      where.valueNumeric = { gte: 25000 };
      where.owner = { is: { title: { contains: 'CEO', mode: 'insensitive' } } };
      break;
    case 'ceo-cfo-sales':
      where.transactionType = { in: ['S - Sale', 'S - Sale+OE'] };
      where.valueNumeric = { gte: 100000 };
      where.owner = { is: { title: { contains: 'CEO', mode: 'insensitive' } } };
      break;
  }
  
  // Apply regular filters
  if (qCompany) where.company = { is: { name: { contains: qCompany, mode: 'insensitive' } } };
  if (qOwner) where.owner = { is: { name: { contains: qOwner, mode: 'insensitive' } } };
  if (typeFilter) where.transactionType = typeFilter;
  if (isInstitutionFilter === 'true') where.owner = { is: { isInstitution: true } };
  if (isInstitutionFilter === 'false') where.owner = { is: { isInstitution: false } };

  const [transactions, totalCount, stats] = await Promise.all([
    prisma.openInsiderTransaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: true,
        owner: true,
      },
    }),
    prisma.openInsiderTransaction.count({ where }),
    prisma.openInsiderTransaction.aggregate({
      _count: { id: true },
      _sum: { valueNumeric: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Get unique companies and owners for autocomplete
  const [companies, owners] = await Promise.all([
    prisma.openInsiderCompany.findMany({
      select: { name: true, ticker: true },
      orderBy: { name: 'asc' },
    }),
    prisma.openInsiderOwner.findMany({
      select: { name: true, isInstitution: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const companyOptions = companies.map(c => ({ value: c.name, label: `${c.name} (${c.ticker})` }));
  const ownerOptions = owners.map(o => ({ 
    value: o.name, 
    label: `${o.name}${o.isInstitution ? ' (Institution)' : ''}` 
  }));

  const transactionTypes = ['P', 'S', 'A', 'D', 'G', 'M', 'F', 'I', 'J', 'K', 'L', 'N', 'O', 'W', 'X', 'Z'];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="zh-Hant">內幕交易</span>
                <span className="zh-Hans hidden">内幕交易</span>
              </h1>
              <p className="text-gray-300 text-lg">
                <span className="zh-Hant">來自 OpenInsider 的內幕交易數據</span>
                <span className="zh-Hans hidden">来自 OpenInsider 的内幕交易数据</span>
              </p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/watchlist"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="zh-Hant">我的關注</span>
                <span className="zh-Hans hidden">我的关注</span>
              </Link>
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
              {totalCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">總價值</span>
              <span className="zh-Hans hidden">总价值</span>
            </h3>
            <p className="text-3xl font-bold text-green-400">
              ${stats._sum.valueNumeric ? (Number(stats._sum.valueNumeric) / 1000000).toFixed(1) + 'M' : '0'}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              <span className="zh-Hant">公司數</span>
              <span className="zh-Hans hidden">公司数</span>
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              {companies.length.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filter Categories */}
        <FilterCategories currentFilter={filterCategory} />

        {/* Advanced Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            <span className="zh-Hant">進階篩選</span>
            <span className="zh-Hans hidden">进阶筛选</span>
          </h3>
          <form id="insider-filters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AutocompleteInput
                name="qc"
                placeholder="搜索公司..."
                options={companyOptions}
                defaultValue={qCompany}
              />
              <AutocompleteInput
                name="qo"
                placeholder="搜索交易者..."
                options={ownerOptions}
                defaultValue={qOwner}
              />
              <select
                name="type"
                defaultValue={typeFilter}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有交易類型</option>
                {transactionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                name="institution"
                defaultValue={isInstitutionFilter}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有交易者</option>
                <option value="true">機構</option>
                <option value="false">個人</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
              >
                <span className="zh-Hant">篩選</span>
                <span className="zh-Hans hidden">筛选</span>
              </button>
              <ClearFiltersButton formId="insider-filters" />
            </div>
          </form>
        </div>

        {/* Export and Table Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <ExportButton 
              data={transactions.map(t => ({
                transactionDate: t.transactionDate,
                tradeDate: t.tradeDate,
                ticker: t.company.ticker,
                companyName: t.company.name,
                ownerName: t.owner.name,
                title: t.owner.title,
                transactionType: t.transactionType,
                lastPrice: t.lastPrice ? Number(t.lastPrice) : 0,
                quantity: t.quantity,
                sharesHeld: t.sharesHeld,
                owned: t.owned,
                value: t.value
              }))}
              filename="insider-trades"
            />
            <span className="text-sm text-gray-400">
              <span className="zh-Hant">顯示 {transactions.length} 筆交易</span>
              <span className="zh-Hans hidden">显示 {transactions.length} 笔交易</span>
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <SortableHeader 
                      field="transactionDate" 
                      currentSort={sortKey} 
                      currentOrder={order}
                      label="申報日期"
                      labelHans="申报日期"
                      searchParams={sp}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <SortableHeader 
                      field="tradeDate" 
                      currentSort={sortKey} 
                      currentOrder={order}
                      label="交易日期"
                      labelHans="交易日期"
                      searchParams={sp}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">股票代碼</span>
                    <span className="zh-Hans hidden">股票代码</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">公司名稱</span>
                    <span className="zh-Hans hidden">公司名称</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">內部人名稱</span>
                    <span className="zh-Hans hidden">内部人名称</span>
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
                    <SortableHeader 
                      field="lastPrice" 
                      currentSort={sortKey} 
                      currentOrder={order}
                      label="價格"
                      labelHans="价格"
                      searchParams={sp}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">數量</span>
                    <span className="zh-Hans hidden">数量</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">持有股數</span>
                    <span className="zh-Hans hidden">持有股数</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <span className="zh-Hant">持股變化</span>
                    <span className="zh-Hans hidden">持股变化</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <SortableHeader 
                      field="valueNumeric" 
                      currentSort={sortKey} 
                      currentOrder={order}
                      label="交易價值"
                      labelHans="交易价值"
                      searchParams={sp}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {transactions.length === 0 ? (
                  // Show skeleton loading rows
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRowSkeleton key={`skeleton-${index}`} />
                  ))
                ) : (
                  transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(transaction.tradeDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {transaction.company.ticker}
                    </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <Link
                    href={`/insider/company/${transaction.company.id}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
                  >
                    {transaction.company.name}
                  </Link>
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
                  <span className="zh-Hant">{translateTitle(transaction.owner.title, 'hant')}</span>
                  <span className="zh-Hans hidden">{translateTitle(transaction.owner.title, 'hans')}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <span className="zh-Hant">{translateTxnType(transaction.transactionType, 'hant')}</span>
                    <span className="zh-Hans hidden">{translateTxnType(transaction.transactionType, 'hans')}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  ${transaction.lastPrice?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {transaction.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {transaction.owned}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {transaction.sharesHeld}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {transaction.valueNumeric ? `$${Number(transaction.valueNumeric).toLocaleString()}` : transaction.value}
                </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex space-x-2">
              {page > 1 && (
                <Link
                  href={`/insider?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                  className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                  <span className="zh-Hant">上一頁</span>
                  <span className="zh-Hans hidden">上一页</span>
                </Link>
              )}
              <span className="px-3 py-2 bg-blue-600 text-white rounded-md">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/insider?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                  className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                  <span className="zh-Hant">下一頁</span>
                  <span className="zh-Hans hidden">下一页</span>
                </Link>
              )}
            </nav>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-8 text-center text-gray-400">
          <LastUpdated />
        </div>
      </div>
    </div>
  );
}