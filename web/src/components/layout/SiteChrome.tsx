import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';
import GlobalSearch from '@/components/GlobalSearch';
import SiteFooter from '@/components/marketing/SiteFooter';
import type { getSessionUser } from '@/lib/auth';

type SiteChromeProps = {
  children: React.ReactNode;
  user: Awaited<ReturnType<typeof getSessionUser>>;
  substackUrl: string;
};

export default function SiteChrome({ children, user, substackUrl }: SiteChromeProps) {
  return (
    <>
      <header className="border-b border-gray-600 bg-gray-900/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <Link href="/" className="text-2xl font-bold text-white hover:text-blue-300 transition-colors duration-200 mr-6">
              內幕流
            </Link>

            <nav className="space-x-4 text-sm" role="navigation" aria-label="Main navigation">
              <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/" aria-label="Home page">
                <span className="zh-Hant">首頁</span>
                <span className="zh-Hans hidden">首页</span>
                <span className="ko hidden">홈</span>
              </Link>
              <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/trades" aria-label="Trades page">
                <span className="zh-Hant">交易</span>
                <span className="zh-Hans hidden">交易</span>
                <span className="ko hidden">거래</span>
              </Link>
              <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/politicians" aria-label="Politicians page">
                <span className="zh-Hant">議員</span>
                <span className="zh-Hans hidden">议员</span>
                <span className="ko hidden">의원</span>
              </Link>
              <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/issuers" aria-label="Issuers page">
                <span className="zh-Hant">發行商</span>
                <span className="zh-Hans hidden">发行商</span>
                <span className="ko hidden">발행사</span>
              </Link>
              <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/insider" aria-label="Insider page">
                <span className="zh-Hant">企業交易</span>
                <span className="zh-Hans hidden">企业交易</span>
                <span className="ko hidden">기업 거래</span>
              </Link>
              <Link className="text-amber-400 hover:text-amber-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/upgrade" aria-label="Upgrade">
                <span className="zh-Hant">升級</span>
                <span className="zh-Hans hidden">升级</span>
                <span className="ko hidden">업그레이드</span>
              </Link>
              <Link
                className="text-orange-400 hover:text-orange-300 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200"
                href={substackUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Substack weekly"
              >
                Substack
              </Link>
            </nav>

            <div className="flex-1 max-w-md mx-auto lg:mx-0">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-3">
              <LanguageToggle />
              {user ? (
                <>
                  <span className="text-sm text-gray-300">{user.email}</span>
                  <Link className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/account" aria-label="My Account">
                    <span className="zh-Hant">帳戶</span>
                    <span className="zh-Hans hidden">账户</span>
                    <span className="ko hidden">계정</span>
                  </Link>
                  <Link className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/watchlist" aria-label="My Watchlist">
                    <span className="zh-Hant">觀察名單</span>
                    <span className="zh-Hans hidden">观察名单</span>
                    <span className="ko hidden">관심 목록</span>
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" type="submit" aria-label="Logout">
                      <span className="zh-Hant">登出</span>
                      <span className="zh-Hans hidden">登出</span>
                      <span className="ko hidden">로그아웃</span>
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/register" aria-label="Register">
                    <span className="zh-Hant">註冊</span>
                    <span className="zh-Hans hidden">注册</span>
                    <span className="ko hidden">회원가입</span>
                  </Link>
                  <Link className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/login" aria-label="Login">
                    <span className="zh-Hant">登入</span>
                    <span className="zh-Hans hidden">登录</span>
                    <span className="ko hidden">로그인</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      <footer className="border-t border-gray-800 bg-gray-950 mt-auto">
        <SiteFooter />
      </footer>
    </>
  );
}
