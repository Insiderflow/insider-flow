import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { getSessionUser } from '@/lib/auth';
import LanguageInitializer from '@/components/LanguageInitializer';
import SiteChrome from '@/components/layout/SiteChrome';
import MobileHandoffScript from '@/components/MobileHandoffScript';
import { getSubstackPublishUrl } from '@/lib/siteConfig';
import { isAiAgentRoute } from '@/lib/aiAgentSite';

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
  title: "內幕流 Insider Flow — 美國國會股票披露（繁中）",
  description:
    "華語介面追蹤美國國會議員 STOCK 交易與披露。免費完整交易表、Substack 週報；付費解鎖深度頁與圖表。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const standalone = isAiAgentRoute(pathname);
  const user = standalone ? null : await getSessionUser();
  const substackUrl = getSubstackPublishUrl();

  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        {!standalone && <MobileHandoffScript />}
        {!standalone && (
          <>
            <Script async src="https://www.googletagmanager.com/gtag/js?id=G-XNQRFHM8EV" />
            <Script id="google-analytics">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XNQRFHM8EV');
          `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${standalone ? "bg-[#0b1220] text-white" : "language-zh-Hant"}`}
      >
        {!standalone && <LanguageInitializer />}
        {standalone ? (
          children
        ) : (
          <SiteChrome user={user} substackUrl={substackUrl}>
            {children}
          </SiteChrome>
        )}
      </body>
    </html>
  );
}
