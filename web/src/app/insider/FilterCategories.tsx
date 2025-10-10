'use client';

interface FilterCategoriesProps {
  currentFilter: string;
}

export default function FilterCategories({ currentFilter }: FilterCategoriesProps) {
  const latestFilters = [
    // Latest Officer Purchases
    { key: 'top-officer-purchases-today', label: '今日高階主管買入', color: 'blue' },
    { key: 'top-officer-purchases-week', label: '本週高階主管買入', color: 'blue' },
    { key: 'top-officer-purchases-month', label: '本月高階主管買入', color: 'blue' },
    
    // Latest Insider Purchases
    { key: 'top-insider-purchases-today', label: '今日內部人買入', color: 'green' },
    { key: 'top-insider-purchases-week', label: '本週內部人買入', color: 'green' },
    { key: 'top-insider-purchases-month', label: '本月內部人買入', color: 'green' },
    
    // Latest Insider Sales
    { key: 'top-insider-sales-today', label: '今日內部人賣出', color: 'red' },
    { key: 'top-insider-sales-week', label: '本週內部人賣出', color: 'red' },
    { key: 'top-insider-sales-month', label: '本月內部人賣出', color: 'red' },
  ];

  const topFilters = [
    // High Value Trades
    { key: 'high-value-purchases', label: '高價值買入', color: 'purple' },
    { key: 'high-value-sales', label: '高價值賣出', color: 'yellow' },
    
    // Special Categories
    { key: 'penny-stock', label: '低價股', color: 'orange' },
    { key: 'ceo-cfo-purchases', label: 'CEO/CFO買入', color: 'indigo' },
    { key: 'ceo-cfo-sales', label: 'CEO/CFO賣出', color: 'pink' },
  ];

  const handleFilterClick = (filterKey: string) => {
    window.location.href = `/insider?filter=${filterKey}`;
  };

  const handleClearAll = () => {
    window.location.href = '/insider';
  };

  const renderFilterButton = (filter: any) => {
    const isActive = currentFilter === filter.key;
    const colorClasses = {
      blue: isActive ? 'bg-blue-700 text-white ring-2 ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 text-white',
      red: isActive ? 'bg-red-700 text-white ring-2 ring-red-400' : 'bg-red-600 hover:bg-red-700 text-white',
      green: isActive ? 'bg-green-700 text-white ring-2 ring-green-400' : 'bg-green-600 hover:bg-green-700 text-white',
      purple: isActive ? 'bg-purple-700 text-white ring-2 ring-purple-400' : 'bg-purple-600 hover:bg-purple-700 text-white',
      yellow: isActive ? 'bg-yellow-700 text-white ring-2 ring-yellow-400' : 'bg-yellow-600 hover:bg-yellow-700 text-white',
      orange: isActive ? 'bg-orange-700 text-white ring-2 ring-orange-400' : 'bg-orange-600 hover:bg-orange-700 text-white',
      indigo: isActive ? 'bg-indigo-700 text-white ring-2 ring-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white',
      pink: isActive ? 'bg-pink-700 text-white ring-2 ring-pink-400' : 'bg-pink-600 hover:bg-pink-700 text-white',
    };
    
    return (
      <button
        key={filter.key}
        onClick={() => handleFilterClick(filter.key)}
        className={`px-4 py-2 rounded-md text-sm transition-colors duration-200 ${colorClasses[filter.color as keyof typeof colorClasses]}`}
      >
        {filter.label}
      </button>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">
        <span className="zh-Hant">篩選類別</span>
        <span className="zh-Hans hidden">筛选类别</span>
      </h3>
      
      {/* Latest Section */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-300 mb-3">
          <span className="zh-Hant">最新</span>
          <span className="zh-Hans hidden">最新</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {latestFilters.map(renderFilterButton)}
        </div>
      </div>

      {/* Divider Line */}
      <div className="border-t border-gray-600 mb-6"></div>

      {/* Top Section */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-300 mb-3">
          <span className="zh-Hant">頂級</span>
          <span className="zh-Hans hidden">顶级</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {topFilters.map(renderFilterButton)}
        </div>
      </div>

      {/* Clear All Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handleClearAll}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors duration-200"
        >
          <span className="zh-Hant">清除全部</span>
          <span className="zh-Hans hidden">清除全部</span>
        </button>
      </div>
    </div>
  );
}
