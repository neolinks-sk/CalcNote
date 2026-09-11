"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { formatDateTime } from "@/utils/format";
import { DEFAULT_SHEET_TITLE } from "@/utils/validation";
import HistoryItemRow from "./HistoryItem";
import DrawingCanvas from "@/components/Drawing/DrawingCanvas";

export default function HistoryList() {
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sheet = useCalcStore((s) => s.getCurrentSheet());
  const renameSheet = useCalcStore((s) => s.renameSheet);
  const addNewLine = useCalcStore((s) => s.addNewLine);
  const clearActiveItem = useCalcStore((s) => s.clearActiveItem);
  const isSampleState = useCalcStore((s) => s.isSampleState);
  const mode = useCalcStore((s) => s.mode);
  const isDrawMode = mode === "draw";

  if (!sheet) return null;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea"))
    ) {
      return;
    }
    clearActiveItem();
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div
      className={`relative flex h-full flex-col ${
        isDrawMode ? "select-none" : ""
      }`}
      onClick={handleBackgroundClick}
    >
      {/* 1. タイトル部（ヘッダー領域：固定） */}
      <div
        ref={headerRef}
        data-export-header="true"
        className={`relative shrink-0 border-b border-slate-100 px-3.5 pb-2 transition-all ${
          isSampleState ? "pt-6 sm:pt-7" : "pt-2.5"
        }`}
      >
        <div className="relative flex items-center w-full z-10">
          <input
            type="text"
            value={sheet.title}
            onClick={(e) => e.stopPropagation()}
            onFocus={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                requestAnimationFrame(() => window.scrollTo(0, 0));
                setTimeout(() => window.scrollTo(0, 0), 50);
              }
            }}
            onChange={(e) => renameSheet(sheet.id, e.target.value)}
            onBlur={(e) => {
              const trimmed = e.target.value.trim();
              renameSheet(sheet.id, trimmed === "" ? DEFAULT_SHEET_TITLE : trimmed.slice(0, 60));
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }
            }}
            placeholder={DEFAULT_SHEET_TITLE}
            aria-label="シート名"
            className="w-full bg-transparent text-base sm:text-base font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-slate-100/80 rounded px-1 -ml-1 transition-colors"
          />
        </div>
        <div className="mt-0.5 flex items-center justify-between text-xs text-slate-400 z-10 relative">
          <span>更新: {formatDateTime(sheet.updatedAt)}</span>
        </div>

        {/* ヘッダー専用の手書きCanvas（ヘッダー内に固定され、スクロールしてもずれない） */}
        <DrawingCanvas target="header" />
      </div>

      {/* 2. 計算式スクロール領域（メイン計算エリア） */}
      <div
        ref={scrollContainerRef}
        className={`relative min-h-0 flex-1 overflow-y-auto px-3 cursor-default transition-all ${
          isSampleState ? "pt-7 pb-3" : "py-2"
        }`}
        onClick={handleBackgroundClick}
      >
        <div data-export-main="true" className="relative min-h-full flex flex-col">
          <ul className="flex flex-col gap-0.5 pb-2 relative z-10">
            {sheet.items.map((item, index) => (
              <HistoryItemRow
                key={item.id}
                item={item}
                index={index}
                isLast={index === sheet.items.length - 1}
              />
            ))}
            <li className="pt-2 export-hide">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addNewLine();
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-400 hover:text-slate-600 active:scale-98"
              >
                <Plus size={14} />
                新しい行を追加
              </button>
            </li>
          </ul>

          {/* 最下行入力時でも背景タップで確実に編集確定（blur）できる十分な余白領域 */}
          <div
            className="min-h-[140px] sm:min-h-[100px] w-full flex-1 cursor-default export-hide"
            onClick={handleBackgroundClick}
            aria-hidden="true"
          />

          {/* メイン計算エリア専用の手書きCanvas（計算式DOMと一緒に自然にスクロール） */}
          <DrawingCanvas target="main" />
        </div>
      </div>
    </div>
  );
}
