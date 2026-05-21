import Link from 'next/link';
import { CONTACT_EMAIL, getSubstackPublishUrl } from '@/lib/siteConfig';

export default function SiteFooter() {
  const substack = getSubstackPublishUrl();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-950 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <h3 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              <span className="zh-Hant">產品</span>
              <span className="zh-Hans hidden">产品</span>
              <span className="ko hidden">제품</span>
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/trades" className="hover:text-orange-300 transition-colors">
                  <span className="zh-Hant">交易列表</span>
                  <span className="zh-Hans hidden">交易列表</span>
                  <span className="ko hidden">거래 목록</span>
                </Link>
              </li>
              <li>
                <Link href="/politicians" className="hover:text-orange-300 transition-colors">
                  <span className="zh-Hant">議員</span>
                  <span className="zh-Hans hidden">议员</span>
                  <span className="ko hidden">의원</span>
                </Link>
              </li>
              <li>
                <Link href="/upgrade" className="hover:text-orange-300 transition-colors">
                  <span className="zh-Hant">升級付費</span>
                  <span className="zh-Hans hidden">升级付费</span>
                  <span className="ko hidden">유료 업그레이드</span>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              <span className="zh-Hant">免費週報</span>
              <span className="zh-Hans hidden">免费周报</span>
              <span className="ko hidden">무료 주간 리포트</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3 zh-Hant">長文觀點與每週精選，與站內即時數據互補。</p>
            <p className="text-xs text-gray-500 mb-3 zh-Hans hidden">长文观点与每周精选，与站内即时数据互补。</p>
            <p className="text-xs text-gray-500 mb-3 ko hidden">심층 분석과 주간 하이라이트 — 사이트 실시간 데이터와 보완.</p>
            <Link
              href={substack}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              Substack →
            </Link>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-blue-300 transition-colors">
                  <span className="zh-Hant">隱私權政策</span>
                  <span className="zh-Hans hidden">隐私政策</span>
                  <span className="ko hidden">개인정보 처리방침</span>
                </Link>
                <span className="block text-[10px] text-gray-600 mt-0.5">Privacy Policy</span>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-300 transition-colors">
                  <span className="zh-Hant">服務條款</span>
                  <span className="zh-Hans hidden">服务条款</span>
                  <span className="ko hidden">이용약관</span>
                </Link>
                <span className="block text-[10px] text-gray-600 mt-0.5">Terms of Service</span>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-blue-300 transition-colors">
                  {CONTACT_EMAIL}
                </a>
                <span className="block text-[10px] text-gray-600 mt-0.5">Contact</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              <span className="zh-Hant">信任與安全</span>
              <span className="zh-Hans hidden">信任与安全</span>
              <span className="ko hidden">신뢰 및 보안</span>
            </h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li className="zh-Hant">結帳由 Stripe 處理（PCI 級安全）</li>
              <li className="zh-Hans hidden">结账由 Stripe 处理（PCI 级安全）</li>
              <li className="ko hidden">결제는 Stripe 처리（PCI 수준 보안）</li>
              <li className="zh-Hant">國會 STOCK 資料來自官方披露管道</li>
              <li className="zh-Hans hidden">国会 STOCK 数据来自官方披露管道</li>
              <li className="ko hidden">의회 STOCK 데이터는 공식 공시 채널에서 수집</li>
              <li lang="en" className="text-[11px] text-gray-600 pt-1">
                Not investment advice. Past filings do not predict returns.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 space-y-3 text-[11px] sm:text-xs leading-relaxed text-gray-500">
          <p className="zh-Hant">
            <strong className="text-gray-400">免責聲明：</strong>
            內幕流僅彙整公開資訊，不提供投資建議、不構成買賣邀約。投資涉及風險，請獨立判斷或諮詢持牌顧問。本站與美國國會、證券監管機構無官方關聯。
          </p>
          <p className="zh-Hans hidden">
            <strong className="text-gray-400">免责声明：</strong>
            内幕流仅汇总公开信息，不提供投资建议、不构成买卖邀约。投资涉及风险，请独立判断或咨询持牌顾问。本站与美国国会、证券监管机构无官方关联。
          </p>
          <p className="ko hidden">
            <strong className="text-gray-400">면책 조항:</strong>
            Insider Flow는 공개 정보만을 집계하며, 투자 권유나 매매 권고를 제공하지 않습니다. 투자에는 위험이 따릅니다. 독립적 판단 또는 면허 보유 자문가와 상담하세요. 본 사이트는 미국 의회·SEC와 공식 제휴 관계가 없습니다.
          </p>
          <p lang="en" className="text-gray-600">
            Insider Flow aggregates public disclosures only. Not financial advice. Not affiliated with the U.S. Congress or the SEC.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600 border-t border-gray-800 pt-4">
          <span>© {year} Insider Flow · insiderflow.asia</span>
          <span className="zh-Hant">繁中為主 · 簡中可切換 · English notes where marked</span>
          <span className="zh-Hans hidden">简中为主 · 繁体可切换 · English notes where marked</span>
          <span className="ko hidden">번체 기본 · 간체/한국어 전환 · English notes where marked</span>
        </div>
      </div>
    </footer>
  );
}
