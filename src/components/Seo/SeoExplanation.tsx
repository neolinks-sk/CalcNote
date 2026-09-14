import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Edit3,
  FilePlus,
  FileText,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Newspaper,
  Pencil,
  Sparkles,
} from "lucide-react";
import { COLUMNS } from "@/data/columns";

interface StepItem {
  icon: typeof FilePlus;
  title: string;
  desc: ReactNode;
}

const STEPS: StepItem[] = [
  {
    icon: FilePlus,
    title: "1. シートの作成・保存",
    desc: "ヘッダーの「＋」で新規シートを作成。「保存」ボタンで保存し、タイトルメニューから切り替えられます。",
  },
  {
    icon: Calculator,
    title: "2. 電卓で計算",
    desc: "画面下部のテンキーで入力すると、計算結果が自動生成されます。",
  },
  {
    icon: FileText,
    title: "3. メモで補足",
    desc: (
      <span>
        各行のメモアイコン（
        <span className="inline-flex items-center align-middle mx-0.5 text-slate-500">
          <Pencil size={13} strokeWidth={2} />
        </span>
        ）をタップして、項目名や補足メモを入力できます。
      </span>
    ),
  },
  {
    icon: Edit3,
    title: "4. 手書きで強調",
    desc: "ツールバーで「手書き操作」に切り替え、ペンの色や太さを選んで注目ポイントを強調できます。",
  },
  {
    icon: ImageIcon,
    title: "5. 画像で保存",
    desc: "右上の画像エクスポートボタンから、ワンタップで手書き・メモ入りの画像を端末に保存・共有できます。",
  },
];

const USE_CASES = [
  {
    title: "割り勘・飲み会の精算",
    desc: "誰がいくら払ったかをメモし、手書きで強調してLINEへ共有。",
  },
  {
    title: "家計簿・残高管理",
    desc: "支出項目をメモしながら計算過程を分かりやすく記録。",
  },
  {
    title: "DIY・採寸計算",
    desc: "寸法や資材費を計算し、手書きの矢印や注記でミス防止。",
  },
  {
    title: "カロリー・健康管理",
    desc: "1日の合計カロリーをメモ付きで視覚的に記録。",
  },
];

const FAQS = [
  {
    q: "会員登録や料金は必要ですか？",
    a: "不要です。完全無料で今すぐお使いいただけます。",
  },
  {
    q: "入力したデータはどこに保存されますか？",
    a: "すべてお使いの端末（ブラウザ）内に保存され、外部サーバーへは送信されません。",
  },
  {
    q: "画像保存はスマホでもできますか？",
    a: "はい。画像を保存ボタンを押すことで、スマホの写真アプリへの保存や長押し保存が可能です。",
  },
];

export default function SeoExplanation() {
  const previewColumns = COLUMNS.slice(0, 3);

  return (
    <section className="mx-auto w-full max-w-[500px] px-4 py-10 text-slate-700">
      <div className="space-y-8">
        {/* CalcNoteとは */}
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Info size={18} className="text-slate-700 shrink-0" />
            <span>CalcNoteとは</span>
          </h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-2xs">
            <p>
              CalcNote（カルクノート）は、計算結果の1行ごとにテキストメモを残せ、画面上に直接フリーハンドで丸囲みや矢印を書き込める無料のWeb電卓アプリです。登録不要で、すべてのデータはお使いの端末内に安全に保存されます。
            </p>
          </div>
        </div>

        {/* CalcNoteの使い方 */}
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <BookOpen size={18} className="text-slate-700 shrink-0" />
            <span>CalcNoteの使い方</span>
          </h2>
          <div className="mt-3 space-y-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-slate-300"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800 ring-1 ring-slate-200/80 mt-0.5">
                    <Icon size={14} />
                  </div>
                  <div className="text-xs sm:text-sm leading-relaxed text-slate-700">
                    <strong className="font-bold text-slate-900">{step.title}：</strong>
                    {step.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 活用シーン */}
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Sparkles size={18} className="text-slate-700 shrink-0" />
            <span>活用シーン</span>
          </h2>
          <div className="mt-3 grid gap-2">
            {USE_CASES.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-slate-300"
              >
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-700">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* お役立ちコラム導線セクション */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Newspaper size={18} className="text-slate-700 shrink-0" />
              <span>お役立ちコラム</span>
            </h2>
            <Link
              href="/column"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
            >
              <span>もっと見る</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-3 space-y-2.5">
            {previewColumns.map((col) => (
              <Link
                key={col.slug}
                href={`/column/${col.slug}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {col.category}
                  </span>
                  <time dateTime={col.date}>{col.date}</time>
                </div>
                <h3 className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {col.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {col.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-3 text-center">
            <Link
              href="/column"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 active:scale-98"
            >
              <BookOpen size={15} />
              <span>お役立ちコラム一覧を見る</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* よくある質問（FAQ） */}
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <MessageSquare size={18} className="text-slate-700 shrink-0" />
            <span>よくある質問（FAQ）</span>
          </h2>
          <div className="mt-3 space-y-2.5">
            {FAQS.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
              >
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  Q. {item.q}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-700">
                  A. {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <footer className="pt-6 border-t border-slate-200/80 text-xs text-slate-400">
          <div className="flex justify-end mb-4">
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
            </nav>
          </div>
          <p className="text-center">© 2026 CalcNote. All rights reserved.</p>
        </footer>
      </div>
    </section>
  );
}
