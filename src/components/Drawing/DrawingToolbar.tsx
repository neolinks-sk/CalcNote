"use client";

import { Eraser, PenLine, Type, Undo2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalcStore } from "@/store/useCalcStore";
import { PEN_COLORS, PEN_WIDTHS } from "@/constants";

export default function DrawingToolbar() {
  const mode = useCalcStore((s) => s.mode);
  const setMode = useCalcStore((s) => s.setMode);
  const penColor = useCalcStore((s) => s.penColor);
  const setPenColor = useCalcStore((s) => s.setPenColor);
  const penWidth = useCalcStore((s) => s.penWidth);
  const setPenWidth = useCalcStore((s) => s.setPenWidth);
  const undoLastStroke = useCalcStore((s) => s.undoLastStroke);
  const clearStrokes = useCalcStore((s) => s.clearStrokes);
  const isSampleState = useCalcStore((s) => s.isSampleState);
  const dismissedTooltips = useCalcStore((s) => s.dismissedTooltips);
  const dismissTooltip = useCalcStore((s) => s.dismissTooltip);

  const isDraw = mode === "draw";
  const showDrawTooltip = isSampleState && !dismissedTooltips?.draw;

  const handleToggleMode = () => {
    if (showDrawTooltip) {
      dismissTooltip("draw");
    }
    setMode(isDraw ? "text" : "draw");
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative z-20 flex shrink-0 items-center gap-2 overflow-visible border-b border-slate-100 bg-slate-50 px-2.5 py-2"
    >
      <div className="relative shrink-0 flex items-center">
        <button
          type="button"
          onClick={handleToggleMode}
          className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
            isDraw ? "bg-slate-800 text-white shadow-xs" : "bg-white text-slate-600 ring-1 ring-slate-300"
          }`}
          aria-pressed={isDraw}
          title={isDraw ? "テキスト操作モードに切替" : "手書きモードに切替"}
        >
          {isDraw ? <PenLine size={14} /> : <Type size={14} />}
          {isDraw ? "手書き中" : "テキスト操作"}
        </button>

        {/* 初回サンプル時：「テキスト操作」ボタンのすぐ直下に黒背景の吹き出しバナー（タイトル領域と被らないよう配置・サイズ微小化） */}
        <AnimatePresence>
          {showDrawTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => {
                e.stopPropagation();
                dismissTooltip("draw");
              }}
              title="タップで閉じる"
              role="button"
              tabIndex={0}
              className="absolute top-full mt-1.5 left-0 z-50 flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-xl ring-1 ring-white/20 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="absolute -top-1 left-3.5 h-2 w-2 rotate-45 bg-slate-900" />
              <span>手書き切り替え</span>
              <X size={11} className="text-slate-400 hover:text-white transition-colors ml-0.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-6 w-px shrink-0 bg-slate-200" />

      <div className="flex shrink-0 items-center gap-1.5">
        {PEN_COLORS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setPenColor(preset.color)}
            aria-label={preset.label}
            title={preset.label}
            disabled={!isDraw}
            className={`h-6 w-6 shrink-0 rounded-full border-2 transition active:scale-90 disabled:opacity-40 ${
              penColor === preset.color ? "border-slate-700 scale-110" : "border-white"
            }`}
            style={{ backgroundColor: preset.color, boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }}
          />
        ))}
      </div>

      <div className="h-6 w-px shrink-0 bg-slate-200" />

      <div className="flex shrink-0 items-center gap-1">
        {PEN_WIDTHS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setPenWidth(preset.width)}
            disabled={!isDraw}
            title={`線の太さ: ${preset.label}`}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition active:scale-90 disabled:opacity-40 ${
              penWidth === preset.width ? "bg-slate-800" : "bg-white ring-1 ring-slate-300"
            }`}
          >
            <span
              className="rounded-full"
              style={{
                width: Math.min(16, preset.width + 4),
                height: Math.min(16, preset.width + 4),
                backgroundColor: penWidth === preset.width ? "white" : "#475569",
              }}
            />
          </button>
        ))}
      </div>

      <div className="h-6 w-px shrink-0 bg-slate-200" />

      <button
        type="button"
        onClick={undoLastStroke}
        disabled={!isDraw}
        aria-label="1画取り消し"
        title="1画取り消し（Undo）"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-300 transition active:scale-90 disabled:opacity-40"
      >
        <Undo2 size={16} />
      </button>

      <button
        type="button"
        onClick={clearStrokes}
        disabled={!isDraw}
        aria-label="全消去"
        title="全消去（Clear）"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-red-500 ring-1 ring-red-200 transition active:scale-90 disabled:opacity-40"
      >
        <Eraser size={16} />
      </button>
    </div>
  );
}
