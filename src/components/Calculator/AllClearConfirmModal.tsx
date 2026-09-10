"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";

export default function AllClearConfirmModal() {
  const isOpen = useCalcStore((s) => s.isAllClearModalOpen);
  const closeAllClearModal = useCalcStore((s) => s.closeAllClearModal);
  const confirmAllClear = useCalcStore((s) => s.confirmAllClear);

  // ESCキー押下でモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllClearModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAllClearModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="all-clear-title"
        >
          {/* 背景オーバーレイ（タップでキャンセル） */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeAllClearModal}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* アクションシート本体（下部からスライドアップ） */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white p-5 pb-8 sm:pb-5 shadow-2xl"
          >
            {/* モバイル用上部ドラッグインジケータ */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

            {/* タイトル＆説明 */}
            <div className="text-center pt-1">
              <h3
                id="all-clear-title"
                className="text-base sm:text-lg font-bold text-slate-900"
              >
                すべての計算を削除しますか？
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                現在のシートにある計算行がすべて消去されます。
                <br />
                この操作は取り消せません。
              </p>
            </div>

            {/* アクションボタン群 */}
            <div className="mt-5 flex flex-col gap-2.5">
              {/* 1. 「全ての計算を削除」（削除実行） */}
              <button
                type="button"
                onClick={confirmAllClear}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm sm:text-base font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-98 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Trash2 size={18} />
                すべての計算を削除
              </button>

              {/* 2. 「キャンセル」（何もしない） */}
              <button
                type="button"
                onClick={closeAllClearModal}
                className="w-full rounded-xl bg-slate-100 py-3 text-sm sm:text-base font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-98 focus:outline-none"
              >
                キャンセル
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
