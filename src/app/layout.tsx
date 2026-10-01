import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hit-tool.com"),
  title: "CalcNote｜メモ＆手書きができる無料Web電卓アプリ",
  description:
    "計算過程や結果にテキスト・手書きメモを残してそのまま画像保存・共有できる無料Web電卓ツール。割り勘や買い物、DIYなど後で見返すための計算結果を、一目でわかりやすく記録・共有できます。会員登録不要・完全無料でスマホやPCから今すぐ利用可能です。",
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
    canonical: "/calcnote",
  },
  openGraph: {
    title: "CalcNote｜メモ＆手書きができる無料Web電卓アプリ",
    description:
      "計算過程や結果にテキスト・手書きメモを残してそのまま画像保存・共有できる無料Web電卓ツール。割り勘や買い物、DIYなど後で見返すための計算結果を、一目でわかりやすく記録・共有できます。会員登録不要・完全無料でスマホやPCから今すぐ利用可能です。",
    url: "/calcnote",
    siteName: "CalcNote",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/calcnote/ogp.png",
        width: 1200,
        height: 630,
        alt: "CalcNote｜メモ＆手書きができる無料Web電卓アプリ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CalcNote｜メモ＆手書きができる無料Web電卓アプリ",
    description:
      "計算過程や結果にテキスト・手書きメモを残してそのまま画像保存・共有できる無料Web電卓ツール。割り勘や買い物、DIYなど後で見返すための計算結果を、一目でわかりやすく記録・共有できます。会員登録不要・完全無料でスマホやPCから今すぐ利用可能です。",
    images: ["/calcnote/ogp.png"],
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
  themeColor: "#f1f5f9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} min-h-screen antialiased`}>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-KXFP18WL67"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-KXFP18WL67');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col bg-slate-100 font-sans">{children}</body>
    </html>
  );
}
