import type { Metadata } from "next";
import CalcNoteClient from "./_components/CalcNoteClient";
import SeoExplanation, { FAQS } from "@/components/Seo/SeoExplanation";
import { APP_NAME, SITE_URL } from "@/constants";

export const metadata: Metadata = {
  title: "CalcNote | メモ＆手書きができる無料Web電卓アプリ",
  description:
    "計算過程や結果にテキスト・手書きメモを残してそのまま画像保存・共有できる無料Web電卓ツール。割り勘や買い物、DIYなど後で見返すための計算結果を、一目でわかりやすく記録・共有できます。会員登録不要・完全無料でスマホやPCから今すぐ利用可能です。",
  alternates: {
    canonical: "/calcnote",
  },
  openGraph: {
    title: "CalcNote | メモ＆手書きができる無料Web電卓アプリ",
    description:
      "計算過程や結果にテキスト・手書きメモを残してそのまま画像保存・共有できる無料Web電卓ツール。割り勘や買い物、DIYなど後で見返すための計算結果を、一目でわかりやすく記録・共有できます。会員登録不要・完全無料でスマホやPCから今すぐ利用可能です。",
    url: "/calcnote",
    siteName: APP_NAME,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/calcnote/ogp.png",
        width: 1200,
        height: 630,
        alt: "CalcNote | メモ＆手書きができる無料Web電卓アプリ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CalcNote | メモ＆手書きができる無料Web電卓アプリ",
    description:
      "計算過程や結果にテキスト・手書きメモを残してそのまま画像保存・共有できる無料Web電卓ツール。割り勘や買い物、DIYなど後で見返すための計算結果を、一目でわかりやすく記録・共有できます。会員登録不要・完全無料でスマホやPCから今すぐ利用可能です。",
    images: ["/calcnote/ogp.png"],
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        "name": APP_NAME,
        "url": SITE_URL,
        "description":
          "計算過程や結果にテキスト・手書きメモを残してそのまま画像保存・共有できる無料Web電卓ツール。割り勘や買い物、DIYなど後で見返すための計算結果を、一目でわかりやすく記録・共有できます。会員登録不要・完全無料でスマホやPCから今すぐ利用可能です。",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "JPY",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "ホーム",
            "item": "https://hit-tool.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": APP_NAME,
            "item": SITE_URL,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        "mainEntity": FAQS.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalcNoteClient>
        <SeoExplanation />
      </CalcNoteClient>
    </>
  );
}
