import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Home,
  ImageDown,
  Info,
  PenLine,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  COLUMNS,
  getColumnBySlug,
  getRelatedColumns,
  type ColumnTargetTab,
} from "@/data/columns";
import { APP_NAME, SITE_URL } from "@/constants";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return COLUMNS.map((col) => ({
    slug: col.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const column = getColumnBySlug(slug);

  if (!column) {
    return {
      title: `記事が見つかりません | ${APP_NAME}`,
    };
  }

  const url = `${SITE_URL}/column/${column.slug}`;

  return {
    title: `${column.title} | ${APP_NAME}`,
    description: column.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${column.title} | ${APP_NAME}`,
      description: column.description,
      url,
      siteName: APP_NAME,
      type: "article",
      images: [
        {
          url: column.imageUrl,
          width: 1200,
          height: 630,
          alt: column.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${column.title} | ${APP_NAME}`,
      description: column.description,
      images: [column.imageUrl],
    },
  };
}

function getTabInfo(targetTab: ColumnTargetTab) {
  switch (targetTab) {
    case "handwriting":
      return {
        label: "手書き・注記機能",
        desc: "計算結果の上に直接フリーハンドで丸囲みや矢印を書き込めます。",
        icon: PenLine,
        color: "text-red-600 bg-red-50 border-red-200",
      };
    case "export":
      return {
        label: "画像保存・共有機能",
        desc: "計算式・メモ・手書き注釈をクリーンな1枚の画像にしてLINEやメールで共有できます。",
        icon: ImageDown,
        color: "text-blue-600 bg-blue-50 border-blue-200",
      };
    case "calculator":
    default:
      return {
        label: "計算・インラインメモ機能",
        desc: "1行ごとに数式とテキストメモを残せ、前の計算結果を引き継ぎながらスムーズに計算できます。",
        icon: Calculator,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      };
  }
}

export default async function ColumnDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const column = getColumnBySlug(slug);

  if (!column) {
    notFound();
  }

  const relatedColumns = getRelatedColumns(column.slug, 3);
  const currentIndex = COLUMNS.findIndex((c) => c.slug === column.slug);
  const prevColumn = currentIndex > 0 ? COLUMNS[currentIndex - 1] : null;
  const nextColumn = currentIndex < COLUMNS.length - 1 ? COLUMNS[currentIndex + 1] : null;

  const tabInfo = getTabInfo(column.targetTab);
  const TabIcon = tabInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 共通ナビゲーションヘッダー */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur shadow-2xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 transition hover:opacity-80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-white shadow-xs">
              <Calculator size={16} />
            </div>
            <span>{APP_NAME}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/column"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <BookOpen size={14} />
              <span>コラム一覧</span>
            </Link>
            <Link
              href={`/?tab=${column.targetTab}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-slate-700 active:scale-95"
            >
              <span>アプリで試す</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* パンくずリスト */}
      <nav aria-label="パンくずリスト" className="border-b border-slate-200/80 bg-white/60 px-4 py-2 text-xs text-slate-500">
        <div className="mx-auto flex max-w-4xl items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="flex items-center gap-1 hover:text-slate-800 transition shrink-0">
            <Home size={12} />
            <span>ホーム</span>
          </Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <Link href="/column" className="hover:text-slate-800 transition shrink-0">
            お役立ちコラム
          </Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700 truncate">{column.title}</span>
        </div>
      </nav>

      {/* 記事メインコンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          {/* メタ情報 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-700 ring-1 ring-slate-200">
              <Tag size={12} />
              {column.category}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar size={13} />
              <time dateTime={column.date}>{column.date}</time>
            </span>
          </div>

          {/* 記事タイトル */}
          <h1 className="mt-4 text-xl sm:text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
            {column.title}
          </h1>

          {/* 概要リード文 */}
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs sm:text-sm leading-relaxed text-slate-600">
            <p>{column.description}</p>
          </div>

          {/* アイキャッチ画像 */}
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs">
            <Image
              src={column.imageUrl}
              alt={column.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>

          {/* 本文エリア */}
          <div className="mt-8 sm:mt-10 space-y-6 text-sm sm:text-base leading-relaxed text-slate-700">
            {column.sections.map((section, idx) => {
              if (section.type === "h2") {
                return (
                  <h2
                    key={idx}
                    className="mt-10 sm:mt-12 mb-4 border-b-2 border-slate-800 pb-2 text-lg sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2"
                  >
                    <span>{section.heading}</span>
                  </h2>
                );
              }

              if (section.type === "h3") {
                return (
                  <h3
                    key={idx}
                    className="mt-6 mb-2 text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
                  >
                    <span className="h-4 w-1 bg-emerald-600 rounded-full inline-block" />
                    <span>{section.heading}</span>
                  </h3>
                );
              }

              if (section.type === "p") {
                return (
                  <p key={idx} className="leading-relaxed">
                    {section.text}
                  </p>
                );
              }

              if (section.type === "ul" && section.items) {
                return (
                  <ul key={idx} className="my-4 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }

              if (section.type === "callout") {
                return (
                  <div
                    key={idx}
                    className="my-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 text-emerald-950 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-emerald-900">
                      <Info size={18} className="text-emerald-600 shrink-0" />
                      <span>{section.calloutTitle || "ポイント"}</span>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-emerald-900/90">
                      {section.calloutText}
                    </p>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* 記事末尾のアプリ連携CTAエリア */}
          <div className="mt-12 rounded-2xl border border-slate-300 bg-linear-to-br from-slate-900 to-slate-800 p-6 sm:p-8 text-white shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Sparkles size={16} />
              <span>CalcNote で今すぐ実践</span>
            </div>

            <h3 className="mt-2 text-lg sm:text-2xl font-bold">
              この記事で紹介した「{tabInfo.label}」を体験してみませんか？
            </h3>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
              {tabInfo.desc} 会員登録不要・完全無料でブラウザからすぐにお使いいただけます。
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href={`/?tab=${column.targetTab}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 text-sm sm:text-base transition shadow-md active:scale-98"
              >
                <TabIcon size={18} />
                <span>CalcNote で試してみる（無料）</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/column"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-3.5 text-xs sm:text-sm font-semibold text-white transition"
              >
                <BookOpen size={14} />
                <span>他のコラムを読む</span>
              </Link>
            </div>
          </div>

          {/* 前後の記事リンク */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 border-t border-slate-200 pt-6">
            {prevColumn ? (
              <Link
                href={`/column/${prevColumn.slug}`}
                className="group flex flex-col rounded-xl border border-slate-200 p-3.5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <ArrowLeft size={12} />
                  <span>前の記事</span>
                </span>
                <span className="mt-1 text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {prevColumn.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextColumn ? (
              <Link
                href={`/column/${nextColumn.slug}`}
                className="group flex flex-col rounded-xl border border-slate-200 p-3.5 text-right transition hover:border-slate-300 hover:bg-slate-50 sm:items-end"
              >
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 justify-end">
                  <span>次の記事</span>
                  <ArrowRight size={12} />
                </span>
                <span className="mt-1 text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {nextColumn.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </article>

        {/* 関連記事セクション */}
        {relatedColumns.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 mb-4">
              <BookOpen size={18} className="text-slate-700" />
              <span>関連するお役立ちコラム</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {relatedColumns.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/column/${rel.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <Image
                      src={rel.imageUrl}
                      alt={rel.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <span className="text-[10px] font-bold text-slate-400">{rel.category}</span>
                    <h3 className="mt-1 text-xs sm:text-sm font-bold leading-snug text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Calculator size={14} />
            <span>{APP_NAME}</span>
          </div>
          <p>© 2026 CalcNote. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
