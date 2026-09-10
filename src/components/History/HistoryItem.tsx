"use client";

import { useRef, useState } from "react";
import { CornerDownRight, NotebookPen, Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { HistoryItem as HistoryItemType } from "@/types";
import { useCalcStore } from "@/store/useCalcStore";
import { formatNumber, isErrorResult } from "@/utils/format";
import { hasOperator } from "@/utils/calc";
import { MEMO_MAX_LENGTH } from "@/utils/validation";

interface HistoryItemProps {
  item: HistoryItemType;
  index: number;
  isLast: boolean;
}

export default function HistoryItemRow({ item, index, isLast }: HistoryItemProps) {
  const memoInputRef = useRef<HTMLInputElement>(null);
  const [isMemoOpen, setIsMemoOpen] = useState(false);

  const activeItemId = useCalcStore((s) => s.activeItemId);
  const setActiveItemId = useCalcStore((s) => s.setActiveItemId);
  const updateItemMemo = useCalcStore((s) => s.updateItemMemo);
  const deleteItem = useCalcStore((s) => s.deleteItem);
  const carryOverResult = useCalcStore((s) => s.carryOverResult);
  const isSampleState = useCalcStore((s) => s.isSampleState);
  const dismissedTooltips = useCalcStore((s) => s.dismissedTooltips);
  const dismissTooltip = useCalcStore((s) => s.dismissTooltip);

  const showMemoTooltip = isSampleState && index === 0 && !dismissedTooltips?.memo;
  const showCarryOverTooltip = isSampleState && index === 1 && !dismissedTooltips?.carryOver;

  // アクティブ判定：activeItemIdが一致する場合のみ（フォーカス解除時は全行非アクティブ）
  const isActive = activeItemId === item.id;

  // メモが存在する、または明示的に開かれた場合にメモ欄を表示
  const hasMemo = Boolean(item.memo && item.memo.trim() !== "");
  const showMemoInput = isMemoOpen || hasMemo;

  const handleOpenMemo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showMemoTooltip) {
      dismissTooltip("memo");
    }
    setActiveItemId(item.id);
    setIsMemoOpen(true);
    window.setTimeout(() => {
      memoInputRef.current?.focus();
    }, 50);
  };

  const handleMemoBlur = () => {
    if (!item.memo || item.memo.trim() === "") {
      setIsMemoOpen(false);
      updateItemMemo(item.id, "");
    }
  };

  const handleCarryOver = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showCarryOverTooltip) {
      dismissTooltip("carryOver");
    }
    if (isErrorResult(item.result)) return;
    carryOverResult(item.id);
  };

  const showResult = item.isEvaluated && hasOperator(item.rawInput);
  const resultError = isErrorResult(item.result);
  const resultColor = resultError
    ? "text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
    : item.result < 0
      ? "text-red-500 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
      : "text-emerald-600 bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-100";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        e.stopPropagation();
        setActiveItemId(item.id);
      }}
      className={`group relative border-b border-slate-100/90 export-clean-row transition-all duration-150 py-2.5 pl-3 pr-2 sm:px-3 cursor-pointer select-none sm:select-text rounded-lg ${
        isActive
          ? "bg-slate-100/80 shadow-xs ring-1 ring-slate-200/70"
          : "hover:bg-slate-50/60"
      } ${isSampleState && (index === 0 || index === 1) ? "z-30" : "z-0"}`}
    >
      {/* 【アクティブ行インジケーター】入力対象の行の左端を縦バーで明確に表示 */}
      {isActive && (
        <div className="absolute left-0.5 top-2 bottom-2 w-1 rounded-full bg-slate-800 export-clean-indicator" />
      )}

      {/* 上段：行番号 + [数式入力欄 ＋ 「＝」] ＋ [計算結果数値] ＋ 操作ボタン */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 行番号インジケータ */}
        <span
          className={`shrink-0 select-none text-xs sm:text-sm w-4 sm:w-5 text-center transition-colors ${
            isActive ? "font-bold text-slate-800" : "font-semibold text-slate-300"
          }`}
        >
          {index + 1}
        </span>

        {/* 式と「＝」と計算結果を近接して表示するコンテナ（文字やキャレットが切れないよう overflow-visible を確保） */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap overflow-visible">
          {/* 数式表示エリア ＋ 入力位置点滅カーソル ＋ 末尾の「＝」 */}
          <div
            className="relative inline-flex items-center min-w-0 flex-wrap sm:flex-nowrap py-0.5 pl-1 pr-2 cursor-pointer select-none rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setActiveItemId(item.id);
            }}
            role="button"
            tabIndex={-1}
            aria-label={`行 ${index + 1} の計算式: ${item.rawInput || "未入力"}`}
          >
            {item.rawInput ? (
              <span className="text-left text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-slate-800 break-words whitespace-pre-wrap">
                {item.rawInput}
              </span>
            ) : !isActive ? (
              <span className="text-left text-base sm:text-lg text-slate-300 font-normal py-0.5">
                0 または数式を入力
              </span>
            ) : null}

            {/* 【アクティブ行内の入力位置カーソル】テンキー操作中の打刻位置を点滅表示 */}
            {isActive && (
              <span
                className="inline-block w-[2.5px] h-6 sm:h-7 bg-slate-800 animate-cursor-blink rounded-full shrink-0 ml-0.5 mr-1.5 select-none pointer-events-none export-clean-indicator"
                aria-hidden="true"
              />
            )}

            {/* 空かつアクティブのときの控えめな入力ガイド（カーソルの右側に表示） */}
            {isActive && !item.rawInput && (
              <span className="select-none text-slate-300 font-normal text-base pointer-events-none pr-1 export-clean-indicator">
                数式を入力
              </span>
            )}

            {/* 「＝」記号を計算式の直後（末尾）にくっつけて表示 */}
            {showResult && (
              <span className="select-none text-slate-400 font-medium text-lg sm:text-xl pl-1 pr-1">
                =
              </span>
            )}
          </div>

          {/* 【計算結果】純粋な数値表現（プレフィックス「=」なし）でタップ可能 */}
          <AnimatePresence>
            {showResult && (
              <motion.div className="relative inline-flex items-center">
                {/* 1行目の計算結果(1,155)の上に、余白を十分持たせ一回り以上大胆に大きく2重に囲うラフで歪んだリアルな赤手書き線SVG丸囲み（最前面表示） */}
                {isSampleState && index === 0 && (
                  <svg
                    className="pointer-events-none absolute -inset-x-7 -inset-y-5 sm:-inset-x-8 sm:-inset-y-6 h-[calc(100%+40px)] w-[calc(100%+56px)] overflow-visible select-none z-30"
                    viewBox="0 0 160 60"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M 24,32 C 16,14 44,4 92,4 C 138,4 157,11 155,29 C 153,47 128,56 74,57 C 22,57.5 4,45 6,24 C 8,7 40,2 96,3 C 146,4 159,15 156,33 C 153,49 116,58 58,57 C 26,56.5 9,46 12,30 C 14,18 32,10 58,8"
                      stroke="#ef4444"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {/* 初回サンプル時：2行目計算結果「595」付近を始点とし、3行目の式入力欄にある「595」の数字の直上・左端を正確に指す手書き風赤色矢印（最前面・エクスポート時も反映） */}
                {isSampleState && index === 1 && (
                  <svg
                    className="pointer-events-none absolute top-4.5 -left-40 sm:-left-44 h-12 w-44 sm:w-48 overflow-visible select-none z-40"
                    viewBox="0 0 175 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M 160,2 C 120,12 70,22 28,34"
                      stroke="#ef4444"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 40,24 L 28,34 L 42,39"
                      stroke="#ef4444"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {/* 初回サンプル時：2行目計算結果「595」の斜め右下（メモ欄と重ならない位置）に「タップで続きから計算 ×」吹き出し */}
                {showCarryOverTooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissTooltip("carryOver");
                    }}
                    title="タップで閉じる"
                    role="button"
                    tabIndex={0}
                    className="absolute top-4.5 left-full ml-1.5 sm:ml-2.5 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-xl ring-1 ring-white/20 cursor-pointer active:scale-95 transition-transform export-hide"
                  >
                    <div className="absolute -left-1 top-2.5 h-2 w-2 rotate-45 bg-slate-900" />
                    <span>タップで続きから計算</span>
                    <X size={12} className="text-slate-400 hover:text-white transition-colors ml-0.5" />
                  </motion.div>
                )}

                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.08 }}
                  onClick={handleCarryOver}
                  disabled={resultError}
                  title="タップでこの計算結果を新しい行に引き継ぐ"
                  aria-label={`計算結果 ${formatNumber(item.result)} を新しい行に引き継ぐ`}
                  className={`group/res relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-right text-xl sm:text-2xl font-bold tabular-nums tracking-tight transition shadow-xs export-clean-result ${resultColor}`}
                >
                  <span>
                    {formatNumber(item.result)}
                  </span>
                  <CornerDownRight
                    size={15}
                    className="text-slate-300 transition-colors group-hover/res:text-emerald-600 hidden sm:inline-block export-hide"
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 操作エリア（メモ追加ボタン ＆ 行削除ボタン） */}
        <div className="ml-auto flex items-center gap-1 shrink-0 export-hide">
          {/* メモ追加ボタン（メモがまだない行のみ表示） ＆ 初回サンプル用ツールチップ */}
          {!showMemoInput && (
            <div className="relative">
              {/* 初回サンプル時：1行目のメモ起動アイコン（✎）の真上に黒背景の吹き出しバナー（最前面z-50・点滅なし・×付き・タップでこの吹き出しのみ消去） */}
              <AnimatePresence>
                {showMemoTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.18 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissTooltip("memo");
                    }}
                    title="タップで閉じる"
                    role="button"
                    tabIndex={0}
                    className="absolute -top-7.5 right-0 z-50 flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-xl ring-1 ring-white/20 cursor-pointer active:scale-95 transition-transform"
                  >
                    <span>タップでメモ入力</span>
                    <X size={11} className="text-slate-400 hover:text-white transition-colors ml-0.5" />
                    <div className="absolute -bottom-1 right-2.5 h-2 w-2 rotate-45 bg-slate-900" />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleOpenMemo}
                aria-label={`行 ${index + 1} にメモを追加`}
                title="メモを追加"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-40 transition hover:bg-slate-200/70 hover:text-slate-700 hover:opacity-100 active:scale-90 group-hover:opacity-100 focus:opacity-100"
              >
                <NotebookPen size={15} />
              </button>
            </div>
          )}

          {/* 行削除ボタン */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteItem(item.id);
            }}
            aria-label={`行 ${index + 1} を削除`}
            title="この行を削除"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 opacity-30 transition hover:bg-red-50 hover:text-red-500 active:scale-90 group-hover:opacity-100 focus:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 下段：オンデマンド表示のメモ入力欄 */}
      <AnimatePresence>
        {showMemoInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-1 flex items-center gap-1.5 pl-6 sm:pl-7 pr-1 overflow-hidden"
          >
            <Pencil size={12} strokeWidth={2} className="text-slate-400 shrink-0 select-none" />
            <input
              ref={memoInputRef}
              type="text"
              value={item.memo}
              onChange={(e) => updateItemMemo(item.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onFocus={() => setActiveItemId(item.id)}
              onBlur={handleMemoBlur}
              maxLength={MEMO_MAX_LENGTH}
              placeholder="メモを入力…（例：割り勘・材料費 など）"
              aria-label={`行 ${index + 1} のメモ`}
              className="w-full rounded border-none bg-transparent py-0.5 text-base sm:text-sm text-slate-600 placeholder:text-slate-300 placeholder:italic focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
            {item.memo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateItemMemo(item.id, "");
                  setIsMemoOpen(false);
                }}
                aria-label="メモを削除"
                title="メモを削除"
                className="text-slate-300 hover:text-slate-500 p-1 export-hide"
              >
                <X size={13} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
