import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { sectionTitleStyles, mutedLabelStyles, bodySubtextStyles } from '@/components/typographyStyles';
import { badgeStyles } from '@/components/badgeStyles';
import {
  getLatestMlSignalSnapshot,
  pickHomeHighSignals,
} from '@/lib/ml/mlSnapshotRepo';

const FLAG_LABELS: Record<string, string> = {
  notable_size: '大額',
  committee_sector: '委員會相關',
  congress_cluster: '多人同向',
  insider_cluster: '內部人集體',
};

export default async function HomeHighSignals() {
  const snap = await getLatestMlSignalSnapshot();
  if (!snap) return null;

  const items = pickHomeHighSignals(snap.payload);
  if (!items.length) return null;

  const asOf = snap.generatedAt.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <section className={`${panelSurfaceStyles()} rounded-xl shadow-md`}>
      <div className="mb-2">
        <h2 className={`${sectionTitleStyles()} text-2xl mb-1`}>
          <span className="zh-Hant">⚡ 本週高訊號內部人買入</span>
          <span className="zh-Hans hidden">⚡ 本周高信号内部人买入</span>
          <span className="ko hidden">⚡ 이번 주 고신호 내부자 매수</span>
        </h2>
        <p className={`text-sm ${mutedLabelStyles()}`}>
          <span className="zh-Hant">
            ML + 規則篩選 · 更新 {asOf}
            {snap.sourceLabel ? ` · ${snap.sourceLabel}` : ''}
          </span>
          <span className="zh-Hans hidden">
            ML + 规则筛选 · 更新 {asOf}
            {snap.sourceLabel ? ` · ${snap.sourceLabel}` : ''}
          </span>
          <span className="ko hidden">
            ML + 규칙 필터 · 업데이트 {asOf}
            {snap.sourceLabel ? ` · ${snap.sourceLabel}` : ''}
          </span>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((t) => (
          <article
            key={t.tradeKey}
            className="rounded-lg border border-purple-500/20 bg-gray-800/80 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xl font-bold text-white">{t.ticker}</span>
              <span className={badgeStyles('info', 'sm')}>
                <span className="zh-Hant">評分 {t.signalScore}</span>
                <span className="zh-Hans hidden">评分 {t.signalScore}</span>
                <span className="ko hidden">점수 {t.signalScore}</span>
              </span>
            </div>
            <p className="mt-2 text-sm text-white/90">{t.personName}</p>
            <p className={`text-xs ${bodySubtextStyles()}`}>
              {t.tradeDate}
              {t.valueUsd != null && ` · $${t.valueUsd.toLocaleString('en-US')}`}
              {t.isExecutive && (
                <>
                  {' '}
                  · <span className="text-amber-300/90">CEO/CFO</span>
                </>
              )}
            </p>
            {t.flags.length > 0 && (
              <p className="mt-1 text-xs text-purple-200/80">
                {t.flags.map((f) => FLAG_LABELS[f] ?? f).join(' · ')}
              </p>
            )}
            {t.return5dPct != null && (
              <p className="mt-1 text-xs text-emerald-300/80">
                <span className="zh-Hant">5日報酬 {t.return5dPct}%</span>
                <span className="zh-Hans hidden">5日报酬 {t.return5dPct}%</span>
          <span className="ko hidden">5일 수익률 {t.return5dPct}%</span>
              </p>
            )}
          </article>
        ))}
      </div>

      <p className={`mt-4 text-xs ${mutedLabelStyles()}`}>
        <span className="zh-Hant">僅供研究參考，非投資建議。</span>
        <span className="zh-Hans hidden">仅供研究参考，非投资建议。</span>
          <span className="ko hidden">연구 참고용이며, 투자 권유가 아닙니다.</span>
      </p>
    </section>
  );
}
