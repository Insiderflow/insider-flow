'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function SECDataFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'ALL') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page'); // Reset to first page when filtering
    router.push(`/sec-data?${params.toString()}`);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">政黨</label>
          <select 
            className="bg-gray-700 text-white px-3 py-2 rounded"
            value={searchParams.get('party') || 'ALL'}
            onChange={(e) => handleFilterChange('party', e.target.value)}
          >
            <option value="ALL">全部</option>
            <option value="Republican">共和黨</option>
            <option value="Democratic">民主黨</option>
            <option value="Independent">獨立</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">議院</label>
          <select 
            className="bg-gray-700 text-white px-3 py-2 rounded"
            value={searchParams.get('chamber') || 'ALL'}
            onChange={(e) => handleFilterChange('chamber', e.target.value)}
          >
            <option value="ALL">全部</option>
            <option value="House">眾議院</option>
            <option value="Senate">參議院</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">交易類型</label>
          <select 
            className="bg-gray-700 text-white px-3 py-2 rounded"
            value={searchParams.get('activity') || 'ALL'}
            onChange={(e) => handleFilterChange('activity', e.target.value)}
          >
            <option value="ALL">全部</option>
            <option value="Buy">買入</option>
            <option value="Sell">賣出</option>
            <option value="Exchange">交換</option>
          </select>
        </div>
      </div>
    </div>
  );
}
