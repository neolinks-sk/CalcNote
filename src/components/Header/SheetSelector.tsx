"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImageDown, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalcStore } from "@/store/useCalcStore";
import { APP_NAME } from "@/constants";

interface SheetSelectorProps {
  onExport: () => void;
  isExporting: boolean;
}

export default function SheetSelector({ onExport, isExporting }: SheetSelectorProps) {
  const sheets = useCalcStore((s) => s.sheets);
  const currentSheetId = useCalcStore((s) => s.currentSheetId);
  const selectSheet = useCalcStore((s) => s.selectSheet);
  const createSheet = useCalcStore((s) => s.createSheet);
  const deleteSheet = useCalcStore((s) => s.deleteSheet);
  const saveCurrentSheet = useCalcStore((s) => s.saveCurrentSheet);
  const isSampleState = useCalcStore((s) => s.isSampleState);
  const dismissedTooltips = useCalcStore((s) => s.dismissedTooltips);
  const dismissTooltip = useCalcStore((s) => s.dismissTooltip);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaveToastOpen, setIsSaveToastOpen] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const showNewSheetTooltip = isSampleState && !dismissedTooltips?.newSheet;

  const handleDelete = () => {
    if (!currentSheetId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      window.setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }
    deleteSheet(currentSheetId);
    setConfirmingDelete(false);
  };

  const handleCreate = () => {
    if (showNewSheetTooltip) {
      dismissTooltip("newSheet");
    }
    createSheet("無題のシート");
  };

  const handleSave = () => {
    saveCurrentSheet();
    setIsSaveToastOpen(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setIsSaveToastOpen(false);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <header
      onClick={(e) => e.stopPropagation()}
      className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-2 sm:px-3 py-2 shadow-xs"
    >
      <div className="mx-auto flex max-w-[500px] items-center gap-1 sm:gap-1.5">
        <span className="shrink-0 text-base sm:text-lg font-bold tracking-tight text-slate-800 mr-0.5">
          {APP_NAME}
        </span>

        {/* シート選択プルダウンメニュー */}
        <div className="relative min-w-0 flex-1">
          <select
            aria-label="シートを選択"
            value={currentSheetId ?? ""}
            onChange={(e) => selectSheet(e.target.value)}
            className={`w-full min-w-0 truncate rounded-lg border bg-white px-2 sm:px-2.5 py-1.5 text-base sm:text-sm font-medium text-slate-700 focus:outline-none transition-all shadow-2xs ${
              isSaveToastOpen
                ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400 font-bold text-emerald-900 scale-[1.01]"
                : "border-slate-300 focus:border-slate-500"
            }`}
          >
            {sheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.title.trim() === "" ? "無題のシート" : sheet.title}
              </option>
            ))}
          </select>
        </div>

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          aria-label="シートを保存"
          title="シートを保存"
          className="flex h-8.5 shrink-0 items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 sm:px-2.5 text-xs font-bold transition active:scale-90 shadow-2xs"
        >
          <Save size={14} className="text-emerald-600" />
          <span>保存</span>
        </button>

        {/* 新規シート作成ボタン ＆ 案内吹き出し */}
        <div className="relative shrink-0 flex items-center">
          <button
            type="button"
            onClick={handleCreate}
            aria-label="新規シート作成"
            title="新規シート作成"
            className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition active:scale-90 active:bg-slate-100 shadow-2xs"
          >
            <Plus size={16} />
          </button>

          {/* 初回サンプル時：「＋」アイコン下の案内吹き出しバナー */}
          <AnimatePresence>
            {showNewSheetTooltip && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => {
                  e.stopPropagation();
                  dismissTooltip("newSheet");
                }}
                title="タップで閉じる"
                role="button"
                tabIndex={0}
                className="absolute top-full mt-1.5 right-0 z-50 flex items-center gap-1 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white shadow-xl ring-1 ring-white/20 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-900" />
                <span>新しいシート</span>
                <X size={11} className="text-slate-400 hover:text-white transition-colors ml-0.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 削除ボタン */}
        <button
          type="button"
          onClick={handleDelete}
          aria-label="シート削除"
          title="シート削除"
          disabled={sheets.length === 0}
          className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border transition active:scale-90 disabled:opacity-40 shadow-2xs ${
            confirmingDelete
              ? "border-red-400 bg-red-50 text-red-600"
              : "border-slate-300 bg-white text-slate-600 active:bg-slate-100"
          }`}
        >
          <Trash2 size={16} />
        </button>

        {/* 画像保存・共有ボタン */}
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          aria-label="画像で保存・共有"
          title="画像で保存・共有"
          className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white transition active:scale-90 disabled:opacity-60 shadow-2xs"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImageDown size={16} />
          )}
        </button>
      </div>

      {/* 削除確認メッセージ */}
      {confirmingDelete && (
        <p className="mx-auto mt-1 max-w-[500px] text-right text-xs text-red-500">
          もう一度押すとシートを削除します
        </p>
      )}

      {/* 保存完了ガイドポップアップ（画面上部に表示し、上部プルダウンへ矢印とハイライトで誘導） */}
      <AnimatePresence>
        {isSaveToastOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-[calc(100%-20px)] max-w-[440px] rounded-2xl bg-slate-900/95 p-3 sm:p-3.5 text-white shadow-2xl backdrop-blur-md ring-1 ring-white/20"
          >
            {/* 上部タイトルプルダウンを指し示す上向き矢印 */}
            <div className="absolute -top-1.5 left-1/3 sm:left-40 -translate-x-1/2 h-3 w-3 rotate-45 bg-slate-900 border-l border-t border-white/20" />

            <div className="flex items-start gap-2 sm:gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white">
                  保存しました！
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  保存したシートは上のタイトルメニューから切り替えられます
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveToastOpen(false)}
                className="shrink-0 p-1 text-slate-400 hover:text-white transition rounded-full"
                aria-label="案内を閉じる"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
