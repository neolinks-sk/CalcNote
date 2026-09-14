import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/constants";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CalcNote - メモ＆手書きができる無料電卓アプリ | hit-tool.com",
  description:
    "計算結果にテキストメモやフリーハンドの手書き注記を追加できる無料Web電卓アプリ。割り勘、残高計算、DIY、健康管理などの計算結果を綺麗に画像化してLINEやSNSで共有可能。登録不要・完全無料で即座に利用できます。",
  applicationName: "CalcNote",
  keywords: [
    "CalcNote",
    "カルクノート",
    "電卓 アプリ",
    "無料 電卓",
    "手書き メモ",
    "割り勘 計算",
    "家計簿",
    "hit-tool.com",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "CalcNote - メモ＆手書きができる無料電卓アプリ",
    description:
      "計算結果にテキストメモやフリーハンドの手書き注記を追加できる無料Web電卓アプリ。割り勘・残高計算・DIY・健康管理などをきれいに画像化してSNS共有できます。",
    url: SITE_URL,
    siteName: "CalcNote",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CalcNote - メモ＆手書きができる無料電卓アプリ",
    description:
      "計算結果にテキストメモやフリーハンドの手書き注記を追加できる無料Web電卓アプリ。登録不要・完全無料。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} min-h-screen antialiased`}>
      <body className="min-h-screen flex flex-col bg-slate-100 font-sans">{children}</body>
    </html>
  );
}
