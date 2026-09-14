"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  ChevronRight,
  ExternalLink,
  Home,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { APP_NAME } from "@/constants";

export type CushionType = "privacy" | "contact" | "about";

interface CushionLayoutProps {
  type: CushionType;
  title: string;
  badge: string;
  targetUrl: string;
  buttonLabel: string;
  targetName: string;
}

const ICON_MAP = {
  privacy: ShieldCheck,
  contact: Mail,
  about: Building2,
};

export default function CushionLayout({
  type,
  title,
  badge,
  targetUrl,
  buttonLabel,
  targetName,
}: CushionLayoutProps) {
  const Icon = ICON_MAP[type];

  const handleOpenExternal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      const newWindow = window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (newWindow) {
        newWindow.opener = null;
      }
    } catch (err) {
      console.error("Failed to open external window:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* 共通ナビゲーションヘッダー */}
      <div>
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

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-slate-700 active:scale-95"
            >
              <span>アプリを開く</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </header>

        {/* パンくずリスト */}
        <nav
          aria-label="パンくずリスト"
          className="border-b border-slate-200/80 bg-white/60 px-4 py-2 text-xs text-slate-500"
        >
          <div className="mx-auto flex max-w-5xl items-center gap-1.5">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-slate-800 transition"
            >
              <Home size={12} />
              <span>ホーム</span>
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-semibold text-slate-700">{title}</span>
          </div>
        </nav>

        {/* メインコンテンツ */}
        <main className="mx-auto max-w-lg px-4 py-10 sm:py-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-center">
            {/* アイコン */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 shadow-2xs ring-1 ring-slate-200/70">
              <Icon size={28} className="text-slate-700" />
            </div>

            {/* バッジ */}
            <div className="mt-4">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 uppercase tracking-wider">
                {badge}
              </span>
            </div>

            {/* ページタイトル */}
            <h1 className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>

            {/* 案内文 */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs sm:text-sm leading-relaxed text-slate-600 text-center">
              <p>
                本アプリは HITtools が提供しています。
                <br />
                詳細および手続きは親サイトの専用ページをご確認ください。
              </p>
            </div>

            {/* 外部サイト誘導メインボタン */}
            <div className="mt-6">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                role="button"
                onClick={handleOpenExternal}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition hover:bg-slate-700 active:scale-98 cursor-pointer"
              >
                <span>{buttonLabel}</span>
                <ExternalLink size={16} className="text-slate-300" />
              </a>

              {/* 注意書き（指定の改行位置） */}
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                ※ リンクをクリックすると、
                <br />
                新しいタブで「{targetName}」が開きます。
              </p>
            </div>

            {/* 戻るボタン */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <Link
                href="/"
                replace
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <span>← アプリへ戻る</span>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* フッター */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Calculator size={15} />
            <span>{APP_NAME}</span>
          </div>
          <div className="flex flex-col items-end w-full sm:w-auto">
            <nav aria-label="フッターナビゲーション" className="flex flex-col items-start gap-2 text-slate-500">
              <Link
                href="/privacy"
                className="group inline-flex items-center gap-2 hover:text-slate-800 transition-colors"
              >
                <span className="h-3.5 w-1 rounded-full bg-slate-800 group-hover:bg-slate-950 transition-colors shrink-0" />
                <span>プライバシーポリシー</span>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 hover:text-slate-800 transition-colors"
              >
                <span className="h-3.5 w-1 rounded-full bg-slate-800 group-hover:bg-slate-950 transition-colors shrink-0" />
                <span>お問い合わせ</span>
              </Link>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 hover:text-slate-800 transition-colors"
              >
                <span className="h-3.5 w-1 rounded-full bg-slate-800 group-hover:bg-slate-950 transition-colors shrink-0" />
                <span>運営者情報</span>
              </Link>
              <Link
                href="/column"
                className="group inline-flex items-center gap-2 hover:text-slate-800 transition-colors"
              >
                <span className="h-3.5 w-1 rounded-full bg-slate-800 group-hover:bg-slate-950 transition-colors shrink-0" />
                <span>お役立ちコラム</span>
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-6 text-center text-[11px] text-slate-400">
          <p>© 2026 CalcNote. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
