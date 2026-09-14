import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Calendar,
  ChevronRight,
  Home,
  Tag,
} from "lucide-react";
import { COLUMNS } from "@/data/columns";
import { APP_NAME, SITE_URL } from "@/constants";

export const metadata: Metadata = {
  title: "お役立ちコラム | 電卓×手書きメモアプリ CalcNote",
  description:
    "CalcNoteの活用法や計算テクニック、確定申告・割り勘・DIY・固定費見直しなど、日々の計算と記録をスマートにするお役立ち記事を掲載中。",
  alternates: {
    canonical: `${SITE_URL}/column`,
  },
  openGraph: {
    title: "お役立ちコラム | 電卓×手書きメモアプリ CalcNote",
    description:
      "CalcNoteの活用法や計算テクニック、確定申告・割り勘・DIY・固定費見直しなど、日々の計算と記録をスマートにするお役立ち記事を掲載中。",
    url: `${SITE_URL}/column`,
    siteName: APP_NAME,
    type: "website",
  },
};

export default function ColumnListPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 共通ナビゲーションヘッダー */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 transition hover:opacity-80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-white shadow-xs">
              <Calculator size={16} />
            </div>
            <span>{APP_NAME}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-slate-700 active:scale-95"
            >
              <span>アプリを開く</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* パンくずリスト */}
      <nav aria-label="パンくずリスト" className="border-b border-slate-200/80 bg-white/60 px-4 py-2 text-xs text-slate-500">
        <div className="mx-auto flex max-w-5xl items-center gap-1.5">
          <Link href="/" className="flex items-center gap-1 hover:text-slate-800 transition">
            <Home size={12} />
            <span>ホーム</span>
          </Link>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="font-semibold text-slate-700">お役立ちコラム</span>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="border-b border-slate-200 bg-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            <span>CalcNote 活用ガイド＆お役立ち情報</span>
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            お役立ちコラム
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
            電卓と手書きメモの活用術、確定申告や家計簿、割り勘計算、DIYの採寸など、
            日々の生活や仕事を効率化する実践テクニックをお届けします。
          </p>
        </div>
      </section>

      {/* 記事一覧グリッド */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <BookOpen size={20} className="text-slate-700" />
            <span>すべての記事（{COLUMNS.length}件）</span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COLUMNS.map((column) => (
            <article
              key={column.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
            >
              <Link href={`/column/${column.slug}`} className="flex flex-col flex-1">
                {/* アイキャッチ画像 */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <Image
                    src={column.imageUrl}
                    alt={column.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                      <Tag size={10} />
                      {column.category}
                    </span>
                  </div>
                </div>

                {/* 記事詳細テキスト */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={12} />
                    <time dateTime={column.date}>{column.date}</time>
                  </div>

                  <h3 className="mt-2 text-base font-bold leading-snug text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {column.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-3 flex-1">
                    {column.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    <span>記事を読む</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* 下部CTAバナー */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-linear-to-r from-slate-900 to-slate-800 p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center text-xs font-bold text-emerald-400">
                完全無料・登録不要
              </span>
              <h3 className="mt-1 text-lg sm:text-xl font-bold">
                計算式とメモを1画面で残せる「CalcNote」
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                ブラウザですぐに使えるWeb電卓。手書き注記や画像保存もワンタップで可能です。
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-95"
            >
              <Calculator size={16} />
              <span>今すぐ使ってみる</span>
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
