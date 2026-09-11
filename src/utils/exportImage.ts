import { toPng } from "html-to-image";

/**
 * 指定した要素をレイヤー合成込みで PNG のデータURLへ変換する。
 * html-to-image は内部で <canvas> の現在の描画内容もそのままコピーするため、
 * 手書きキャンバス層とテキスト層(DOM)およびSVG要素が正しく重なった状態で書き出される。
 * 
 * エクスポート専用クラス（Clean Export View）を一時的に付与し、
 * 編集用のカーソル・枠線・操作ボタン・吹き出し等を除外した状態でキャプチャする。
 */
export async function exportNodeAsPng(node: HTMLElement): Promise<string> {
  const exportClass = "clean-export-mode";
  const wasAlreadyClassed = node.classList.contains(exportClass);

  // キャプチャ前のスクロール位置を一時退避し、エクスポート時は 0 にリセット
  const scrollContainers = Array.from(
    node.querySelectorAll<HTMLElement>(".overflow-y-auto, [class*='overflow-y-']")
  );
  const originalScrolls = scrollContainers.map((el) => ({
    el,
    top: el.scrollTop,
    left: el.scrollLeft,
  }));

  if (!wasAlreadyClassed) {
    node.classList.add(exportClass);
  }

  // スクロールコンテナのスクロールを 0 に設定（全高キャプチャ用）
  scrollContainers.forEach((el) => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
  });

  try {
    // 1. フォント読み込み完了を待機
    if (typeof document !== "undefined" && "fonts" in document) {
      await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready;
    }

    // 2. スタイル適用・DOMレイアウト確定（全高展開）の待機
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 3. 手書きCanvasの最新状態（全高展開されたコンテナサイズ・ストローク・scrollTop=0）を強制再描画・完全同期
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("calcnote:force-redraw-canvas"));
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    // Canvasレンダリングの完全確定待ち（150ms）
    await new Promise((resolve) => setTimeout(resolve, 150));

    const options = {
      cacheBust: true,
      pixelRatio: typeof window !== "undefined" ? Math.max(2, window.devicePixelRatio || 1) : 2,
      backgroundColor: "#ffffff",
    };

    // 4. html-to-image のウォームアップ（1回呼んでリソースキャッシュをロードさせ、2回目で確実な結果を取得）
    try {
      await toPng(node, options);
    } catch {
      // 1回目のウォームアップエラーは無視
    }

    return await toPng(node, options);
  } finally {
    if (!wasAlreadyClassed) {
      node.classList.remove(exportClass);
    }
    // スクロール位置の復元
    originalScrolls.forEach(({ el, top, left }) => {
      el.scrollTop = top;
      el.scrollLeft = left;
    });

    // 復元後にもCanvasを通常サイズへ再同期
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("calcnote:force-redraw-canvas"));
    }
  }
}

/**
 * Data URL (Base64) を Blob オブジェクトに変換する
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(parts[1] || "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Data URL (Base64) を File オブジェクトに変換する
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], fileName, { type: "image/png" });
}

/**
 * Web Share API で画像ファイル共有が可能かどうかを厳密に判定する
 */
export function isShareSupported(file?: File): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    const testFile = file || new File([new Uint8Array([0])], "test.png", { type: "image/png" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * 通常の a タグによるファイルダウンロード処理
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 画像を保存または共有する
 * - Web Share API が対応している場合 (iOS Safari / Android Chrome 等):
 *   navigator.share({ files: [file], title: 'CalcNote', text: '' }) で共有シートを起動
 * - 非対応の場合 (PCブラウザ等) または共有失敗時: 通常のダウンロードへフォールバック
 */
export async function saveOrShareImage(
  dataUrl: string,
  fileName: string
): Promise<"shared" | "downloaded" | "cancelled" | "fallback_needed"> {
  try {
    const file = dataUrlToFile(dataUrl, fileName);

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: "CalcNote",
        text: "",
      });
      return "shared";
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      // ユーザーが共有シートをキャンセルした場合
      if (
        err.name === "AbortError" ||
        err.message.toLowerCase().includes("canceled") ||
        err.message.toLowerCase().includes("cancelled")
      ) {
        return "cancelled";
      }
    }
    console.warn("[CalcNote] Web Share API 呼び出しに失敗しました。ダウンロードにフォールバックします:", err);
  }

  // フォールバック: 通常のダウンロード処理
  try {
    downloadDataUrl(dataUrl, fileName);
    return "downloaded";
  } catch (e) {
    console.error("[CalcNote] ダウンロードフォールバックエラー:", e);
    return "fallback_needed";
  }
}

export function buildExportFileName(sheetTitle: string): string {
  const safeTitle = sheetTitle.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 30) || "calcnote";
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(
    2,
    "0"
  )}`;
  return `CalcNote_${safeTitle}_${stamp}.png`;
}
