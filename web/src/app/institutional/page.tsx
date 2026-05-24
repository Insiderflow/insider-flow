import Link from 'next/link';
import { actionStyles } from '@/components/actionStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles, sectionTitleStyles } from '@/components/typographyStyles';
import {
  formatUsdCompact,
  getInstitutionalHoldingsOverview,
} from '@/lib/institutionalHoldings';

export const dynamic = 'force-dynamic';

export default async function InstitutionalPage() {
  const data = await getInstitutionalHoldingsOverview();
  const hasData = data.totalRows > 0;

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="mb-6">
          <h1 className={`${pageTitleStyles()} mb-2`}>機構投資者 (13F)</h1>
          <p className={bodySubtextStyles()}>
            季度 SEC 13F-HR 持股快照 — 誰在季末持有哪些美股（非逐筆交易）
          </p>
        </div>

        {!hasData ? (
          <div className={`${panelSurfaceStyles()} mb-6 border border-amber-500/30`}>
            <h2 className={`${sectionTitleStyles()} mb-2 text-amber-200`}>尚無 13F 數據</h2>
            <p className={`${bodySubtextStyles()} mb-4 text-sm`}>
              需要 Finnhub API key（institutional-ownership 端點）並執行匯入腳本。
            </p>
            <pre className="overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-300">
{`cd insider-flow/web
# Free: SEC bulk TSVs in IphoneAppUI/13F (9 quarters, ~2y)
npm run sec:13f-import
# Or: npm run sec:13f-import -- --all --batch 800`}
            </pre>
          </div>
        ) : (
          <>
            <div
              className={`${panelSurfaceStyles()} mb-6 grid grid-cols-2 gap-4 md:grid-cols-4`}
            >
              <Stat label="持股記錄" value={data.totalRows.toLocaleString()} />
              <Stat label="最新申報季" value={data.latestReportDate ?? '—'} />
              <Stat label="機構數" value={data.investorCount.toLocaleString()} />
              <Stat label="涵蓋股票" value={data.symbolCount.toLocaleString()} />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={panelSurfaceStyles()}>
                <h2 className={`${sectionTitleStyles()} mb-4`}>
                  機構持倉總額（{data.latestReportDate}）
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="pb-2 pr-2">機構</th>
                        <th className="pb-2 pr-2 text-right">標的數</th>
                        <th className="pb-2 text-right">市值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topInvestors.map((inv) => (
                        <tr
                          key={`${inv.name}-${inv.cik}`}
                          className="border-b border-gray-800"
                        >
                          <td className="py-2 pr-2 text-white">
                            {inv.name}
                            {inv.cik ? (
                              <span className="ml-1 text-xs text-gray-500">
                                CIK {inv.cik}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums text-gray-300">
                            {inv.positions}
                          </td>
                          <td className="py-2 text-right tabular-nums text-emerald-400">
                            {formatUsdCompact(inv.valueUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={panelSurfaceStyles()}>
                <h2 className={`${sectionTitleStyles()} mb-4`}>
                  機構持倉最集中標的（{data.latestReportDate}）
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="pb-2 pr-2">代碼</th>
                        <th className="pb-2 pr-2 text-right">機構數</th>
                        <th className="pb-2 text-right">申報市值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topSymbols.map((row) => (
                        <tr key={row.symbol} className="border-b border-gray-800">
                          <td className="py-2 pr-2">
                            <Link
                              href={`/issuers/${row.symbol}`}
                              className="font-medium text-orange-400 hover:underline"
                            >
                              {row.symbol}
                            </Link>
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums text-gray-300">
                            {row.holders}
                          </td>
                          <td className="py-2 text-right tabular-nums text-emerald-400">
                            {formatUsdCompact(row.valueUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        <div className={panelSurfaceStyles()}>
          <h2 className={`${sectionTitleStyles()} mb-4`}>數據說明</h2>
          <ul className={`${bodySubtextStyles()} space-y-2 text-sm`}>
            <li>• 來源：Finnhub → SEC 13F-HR（季末持倉，約滯後 45 天）</li>
            <li>• 與 Form 4 內部人交易、主經紀商 Form 4 資金流為不同申報</li>
            <li>
              • 定期更新：<code className="text-orange-300">npm run finnhub:13f-import</code>
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/insider" className={actionStyles('primary')}>
              內部人交易 (Form 4)
            </Link>
            <Link href="/politicians" className={actionStyles('ghost')}>
              議員交易
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
