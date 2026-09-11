"use client";

import { useEffect, useRef, useState } from "react";
import SheetSelector from "@/components/Header/SheetSelector";
import HistoryList from "@/components/History/HistoryList";
import DrawingToolbar from "@/components/Drawing/DrawingToolbar";
import Keypad from "@/components/Calculator/Keypad";
import AllClearConfirmModal from "@/components/Calculator/AllClearConfirmModal";
import ImageCardModal from "@/components/Export/ImageCardModal";
import SeoExplanation from "@/components/Seo/SeoExplanation";
import { useCalcStore } from "@/store/useCalcStore";
import { CREDIT_TEXT, HISTORY_AREA_MIN_HEIGHT } from "@/constants";
import { buildExportFileName, exportNodeAsPng } from "@/utils/exportImage";

export default function Home() {
  const hasHydrated = useCalcStore((s) => s.hasHydrated);
  const sheet = useCalcStore((s) => s.getCurrentSheet());
  const clearActiveItem = useCalcStore((s) => s.clearActiveItem);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fileName = buildExportFileName(sheet?.title ?? "calcnote");

  // モバイル入力時の画面横揺れ・不要なwindowスクロールの自動防止
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocusIn = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      requestAnimationFrame(() => window.scrollTo(0, 0));
    };

    const handleScroll = () => {
      // window全体の横スクロールや不要な縦スクロールが発生した場合にリセット
      if (window.scrollX !== 0 || (window.scrollY !== 0 && !document.querySelector(".modal-open"))) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    window.addEventListener("focusin", handleFocusIn, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleGlobalBackgroundClick = (e: React.MouseEvent) => {
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

  const handleExport = async () => {
    if (!cardRef.current || isExporting) return;
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    clearActiveItem();
    setIsExporting(true);
    setIsModalOpen(true);
    setImageUrl(null);
    try {
      // フォーカス解除のレンダリング反映待ち
      await new Promise((resolve) => setTimeout(resolve, 50));
      const dataUrl = await exportNodeAsPng(cardRef.current);
      setImageUrl(dataUrl);
    } catch (e) {
      console.error("[CalcNote] 画像生成に失敗しました", e);
      setIsModalOpen(false);
      window.alert("画像の生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasHydrated || !sheet) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
        読み込み中…
      </div>
    );
  }

  return (
    <>
      <div
        className="flex h-dvh w-full max-w-[100vw] overflow-x-hidden flex-col"
        onClick={handleGlobalBackgroundClick}
      >
        <SheetSelector onExport={handleExport} isExporting={isExporting} />

        <div className="flex min-h-0 flex-1 flex-col sm:items-center sm:justify-center sm:overflow-y-auto sm:py-3">
          <div className="mx-auto flex w-full min-h-0 max-w-[500px] flex-1 flex-col bg-white sm:flex-none sm:h-[min(760px,calc(100dvh-88px))] sm:rounded-2xl sm:shadow-lg sm:ring-1 sm:ring-slate-200">
            <DrawingToolbar />

            <div ref={cardRef} className="relative flex min-h-0 flex-1 flex-col bg-white">
              <div
                className="relative min-h-0 flex-1 flex flex-col"
                style={{ minHeight: HISTORY_AREA_MIN_HEIGHT }}
              >
                <HistoryList />
              </div>
              <div className="export-show select-none border-t border-slate-100/70 px-3 py-1.5 text-right text-[10px] tracking-wide text-slate-400">
                {CREDIT_TEXT}
              </div>
            </div>

            <Keypad />
          </div>
        </div>
      </div>

      <SeoExplanation />

      <AllClearConfirmModal />

      <ImageCardModal
        isOpen={isModalOpen}
        imageUrl={imageUrl}
        fileName={fileName}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
