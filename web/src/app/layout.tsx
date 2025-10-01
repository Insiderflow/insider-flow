import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from '@/lib/auth';
import LanguageToggle from '@/components/LanguageToggle';
import LanguageInitializer from '@/components/LanguageInitializer';
import GlobalSearch from '@/components/GlobalSearch';

export const dynamic = 'force-dynamic';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "內幕流 - Insider Flow",
  description: "Political insider trading tracker with portfolio analysis and real-time data",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XNQRFHM8EV"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XNQRFHM8EV');
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageInitializer />
        <header className="border-b border-gray-600 bg-gray-900/90 backdrop-blur sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Site Logo/Name */}
              <Link href="/" className="text-2xl font-bold text-white hover:text-blue-300 transition-colors duration-200 mr-6">
                內幕流
              </Link>
              
              <nav className="space-x-4 text-sm" role="navigation" aria-label="Main navigation">
                <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/" aria-label="Home page">
                  <span className="zh-Hant">首頁</span>
                  <span className="zh-Hans hidden">首页</span>
                </Link>
                <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/trades" aria-label="Trades page">
                  <span className="zh-Hant">交易</span>
                  <span className="zh-Hans hidden">交易</span>
                </Link>
                <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/politicians" aria-label="Politicians page">
                  <span className="zh-Hant">政治家</span>
                  <span className="zh-Hans hidden">政治家</span>
                </Link>
                <Link className="text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/issuers" aria-label="Issuers page">
                  <span className="zh-Hant">發行商</span>
                  <span className="zh-Hans hidden">发行商</span>
                </Link>
              </nav>
              
              {/* Global Search */}
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
                  </Link>
                  <Link className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/watchlist" aria-label="My Watchlist">
                    <span className="zh-Hant">觀察名單</span>
                    <span className="zh-Hans hidden">观察名单</span>
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" type="submit" aria-label="Logout">
                      <span className="zh-Hant">登出</span>
                      <span className="zh-Hans hidden">登出</span>
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/register" aria-label="Register">
                    <span className="zh-Hant">註冊</span>
                    <span className="zh-Hans hidden">注册</span>
                  </Link>
                  <Link className="text-sm text-white hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href="/login" aria-label="Login">
                    <span className="zh-Hant">登入</span>
                    <span className="zh-Hans hidden">登录</span>
                  </Link>
                </>
              )}
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
