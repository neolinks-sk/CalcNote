import Link from "next/link";

interface FooterProps {
  className?: string;
  containerClassName?: string;
}

export default function Footer({
  className = "",
  containerClassName = "",
}: FooterProps) {
  return (
    <footer className={`pt-6 border-t border-slate-200/80 text-xs text-slate-400 ${className}`}>
      <div className={containerClassName}>
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
        <p className="text-center text-[11px] text-slate-400">© 2026 HITtools. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
