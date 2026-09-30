import {
  ArrowUpRight,
  ChefHat,
  ClipboardCheck,
  Shirt,
  Utensils,
  Wrench,
} from "lucide-react";

export interface PortalTool {
  title: string;
  description: string;
  url: string;
  category: string;
  icon: typeof Utensils;
}

export const RELATED_TOOLS: PortalTool[] = [
  {
    title: "レシピ人数変更・調味料g変換｜ケーキ型サイズ変更",
    description:
      "人数の変更やケーキ型のサイズ変更に伴う調味料・材料の分量を自動計算するツール",
    url: "https://hit-tool.com/recipe-calculator",
    category: "料理・計算",
    icon: Utensils,
  },
  {
    title: "持ち物チェックリスト",
    description:
      "旅行や出張の準備・持ち物を一覧でスマートにチェック・管理できるツール",
    url: "https://hit-tool.com/travel-checklist",
    category: "旅行・生活",
    icon: ClipboardCheck,
  },
  {
    title: "冷蔵庫レスキュー｜あまり物でズボラ飯",
    description:
      "冷蔵庫に残っている食材から作れるズボラ飯・簡単レシピを提案するツール",
    url: "https://hit-tool.com/zubora-recipe",
    category: "料理・レシピ",
    icon: ChefHat,
  },
  {
    title: "今日の服装ナビ｜天気に合わせた服装提案",
    description:
      "気温や天候に合わせた最適なコーディネートや服装を提案するツール",
    url: "https://hit-tool.com/fashion-weather",
    category: "天気・ファッション",
    icon: Shirt,
  },
];

interface RelatedToolsProps {
  className?: string;
  gridColsClass?: string;
}

export default function RelatedTools({
  className = "",
  gridColsClass = "space-y-2.5",
}: RelatedToolsProps) {
  return (
    <div className={className}>
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Wrench size={18} className="text-slate-700 shrink-0" />
        <span>関連Webツール</span>
      </h2>
      <div className={`mt-3 ${gridColsClass}`}>
        {RELATED_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <a
              key={tool.url}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200/80">
                    <Icon size={13} />
                  </div>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {tool.category}
                  </span>
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <ArrowUpRight size={13} />
                </div>
              </div>

              <h3 className="mt-2 text-xs sm:text-sm font-bold leading-snug text-slate-900 group-hover:text-emerald-700 transition-colors">
                {tool.title}
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2">
                {tool.description}
              </p>

              <div className="mt-2.5 flex items-center justify-end border-t border-slate-100 pt-2 text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                <span>使ってみる</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
