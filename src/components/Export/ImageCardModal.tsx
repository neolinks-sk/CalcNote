"use client";

import { useEffect, useState } from "react";
import { Check, Download, Loader2, Share2, X } from "lucide-react";
import { isShareSupported, saveOrShareImage } from "@/utils/exportImage";

interface ImageCardModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  fileName: string;
  onClose: () => void;
}

export default function ImageCardModal({
  isOpen,
  imageUrl,
  fileName,
  onClose,
}: ImageCardModalProps) {
  const [canShare, setCanShare] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showLongPressNotice, setShowLongPressNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCanShare(isShareSupported());
      setIsDone(false);
      setIsProcessing(false);
      setShowLongPressNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveOrShare = async () => {
    if (!imageUrl || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await saveOrShareImage(imageUrl, fileName);
      if (result === "shared" || result === "downloaded") {
        setIsDone(true);
        window.setTimeout(() => {
          setIsDone(false);
        }, 3000);
      } else if (result === "fallback_needed") {
        setShowLongPressNotice(true);
      }
    } catch (e) {
      console.error("[CalcNote] 保存/共有エラー:", e);
      setShowLongPressNotice(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="画像プレビュー"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">画像として保存</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* プレビューエリア（長押し保存を完全にサポート） */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100/80 p-4">
          {imageUrl ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={fileName}
                className="mx-auto w-full rounded-lg shadow-md ring-1 ring-slate-200/60 cursor-pointer"
                style={{
                  WebkitTouchCallout: "default",
                  WebkitUserSelect: "auto",
                  userSelect: "auto",
                  pointerEvents: "auto",
                  touchAction: "auto",
                }}
              />
              <p className="text-center text-xs text-slate-400 select-none pt-1 whitespace-nowrap">
                ※画像を長押しして保存することもできます
              </p>
              {showLongPressNotice && (
                <div className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-center text-xs font-medium text-amber-800 border border-amber-200">
                  上の画像を長押しして「写真に保存」を選択してください
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="animate-spin text-slate-400" size={24} />
              <p className="text-sm">画像を生成中です…</p>
            </div>
          )}
        </div>

        {/* モーダルフッター（保存・共有ボタン） */}
        <div className="border-t border-slate-100 p-3 bg-white">
          <button
            type="button"
            onClick={handleSaveOrShare}
            disabled={!imageUrl || isProcessing}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition shadow-sm active:scale-98 disabled:opacity-40 ${
              isDone
                ? "bg-emerald-600"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                処理中…
              </>
            ) : isDone ? (
              <>
                <Check size={16} />
                {canShare ? "共有・保存しました" : "ダウンロード完了"}
              </>
            ) : canShare ? (
              <>
                <Share2 size={16} />
                画像を保存 / 共有
              </>
            ) : (
              <>
                <Download size={16} />
                画像を保存（ダウンロード）
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
