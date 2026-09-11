import { toPng } from "html-to-image";
import type { Stroke, StrokePoint } from "@/types";

/**
 * 指定した要素（計算式カード）と手書きストロークをオフスクリーンCanvas上で完全合成し、高解像度PNGを生成する。
 * 
 * 【オフスクリーン確定合成プロセス】
 * 1. エクスポート専用クラス（.clean-export-mode）でDOMを全高展開し、一時的にスクロールを0に設定。
 * 2. html-to-image でDOM要素（数式・文字・結果・枠線・クレジット等）を高解像度PNG画像としてレンダリング。
 * 3. メモリ上に作成したオフスクリーンCanvas（Offscreen Canvas）にDOM画像をベースとして描画。
 * 4. ヘッダー用Canvasおよびメイン用Canvasの各ストロークデータを、DOM要素の正確な相対座標・レイアウト位置に基づき
 *    高解像度ベクター描画でオフスクリーンCanvasの最前面へ直接重ね合わせ合成（手書き抜けを100%防止）。
 * 5. 合成された確定画像を PNG DataURL として出力し、一時Canvasメモリを安全に解放。
 */
export async function exportNodeAsPng(
  node: HTMLElement,
  strokes?: Stroke[]
): Promise<string> {
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

    // 3. 手書きCanvasの最新状態（全高展開されたコンテナサイズ）を強制再描画
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("calcnote:force-redraw-canvas"));
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 120));

    // 4. DOM要素の位置・サイズを計測（オフスクリーン合成時の座標マッピング用）
    const cardRect = node.getBoundingClientRect();
    const headerEl =
      node.querySelector<HTMLElement>('[data-export-header="true"]') ||
      node.querySelector<HTMLElement>(".border-b");
    const mainEl =
      node.querySelector<HTMLElement>('[data-export-main="true"]') ||
      node.querySelector<HTMLElement>(".min-h-full");

    const headerRect = headerEl ? headerEl.getBoundingClientRect() : null;
    const mainRect = mainEl ? mainEl.getBoundingClientRect() : null;

    const headerBox = {
      left: headerRect ? headerRect.left - cardRect.left : 0,
      top: headerRect ? headerRect.top - cardRect.top : 0,
      width: headerRect ? headerRect.width : cardRect.width,
      height: headerRect ? headerRect.height : 60,
    };

    const mainBox = {
      left: mainRect ? mainRect.left - cardRect.left : 0,
      top: mainRect ? mainRect.top - cardRect.top : headerBox.height,
      width: mainRect ? mainRect.width : cardRect.width,
      height: mainRect ? mainRect.height : Math.max(100, cardRect.height - headerBox.height),
    };

    const pixelRatio = typeof window !== "undefined" ? Math.max(2, window.devicePixelRatio || 1) : 2;

    const options = {
      cacheBust: true,
      pixelRatio,
      backgroundColor: "#ffffff",
    };

    // 5. DOMベース画像（文字・数式・枠線レイヤー）のキャプチャ取得
    let domBasePngUrl: string;
    try {
      domBasePngUrl = await toPng(node, options);
    } catch {
      // 1回目のウォームアップエラー時は再試行
      await new Promise((resolve) => setTimeout(resolve, 50));
      domBasePngUrl = await toPng(node, options);
    }

    // 6. オフスクリーンCanvasでDOM画像 ＋ 手書きレイヤーの確定合成
    const finalDataUrl = await synthesizeOffscreenImage({
      domBasePngUrl,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
      headerBox,
      mainBox,
      strokes,
      node,
    });

    return finalDataUrl;
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

interface SynthesisParams {
  domBasePngUrl: string;
  cardWidth: number;
  cardHeight: number;
  headerBox: { left: number; top: number; width: number; height: number };
  mainBox: { left: number; top: number; width: number; height: number };
  strokes?: Stroke[];
  node: HTMLElement;
}

/**
 * オフスクリーンCanvasを作成し、DOM画像の上に手書きベクター描画またはCanvas描画を完全に合成する
 */
async function synthesizeOffscreenImage(params: SynthesisParams): Promise<string> {
  const { domBasePngUrl, cardWidth, cardHeight, headerBox, mainBox, strokes, node } = params;

  // 1. DOMベース画像を読み込み
  const img = new Image();
  img.src = domBasePngUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("DOMベース画像のロードに失敗しました"));
  });

  // 2. オフスクリーンCanvasの作成
  const offscreen = document.createElement("canvas");
  offscreen.width = img.naturalWidth || Math.round(cardWidth * 2);
  offscreen.height = img.naturalHeight || Math.round(cardHeight * 2);

  const ctx = offscreen.getContext("2d");
  if (!ctx) {
    return domBasePngUrl;
  }

  // 3. DOMベース画像を描画
  ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);

  const scaleX = offscreen.width / (cardWidth || 1);
  const scaleY = offscreen.height / (cardHeight || 1);

  // 4. 手書きストロークの合成
  if (strokes && strokes.length > 0) {
    // A. ストロークデータからの高精度ベクター直接描画（最優先・100%確実に鮮明）
    const drawStrokeToBox = (
      stroke: Stroke,
      box: { left: number; top: number; width: number; height: number }
    ) => {
      if (stroke.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      // スケールに応じた線幅の補正
      ctx.lineWidth = stroke.width * scaleX;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      stroke.points.forEach((p: StrokePoint, i: number) => {
        const px = (box.left + p.x * box.width) * scaleX;
        const py = (box.top + (p.y <= 1.0 ? p.y * box.height : p.y)) * scaleY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
    };

    strokes.forEach((stroke) => {
      if (stroke.target === "header") {
        drawStrokeToBox(stroke, headerBox);
      } else {
        drawStrokeToBox(stroke, mainBox);
      }
    });
  } else {
    // B. DOM内の実Canvas要素からのフォールバック合成
    const headerCanvas = node.querySelector<HTMLCanvasElement>('canvas[data-canvas-target="header"]');
    const mainCanvas = node.querySelector<HTMLCanvasElement>('canvas[data-canvas-target="main"]');

    if (headerCanvas && headerCanvas.width > 0 && headerCanvas.height > 0) {
      ctx.drawImage(
        headerCanvas,
        headerBox.left * scaleX,
        headerBox.top * scaleY,
        headerBox.width * scaleX,
        headerBox.height * scaleY
      );
    }
    if (mainCanvas && mainCanvas.width > 0 && mainCanvas.height > 0) {
      ctx.drawImage(
        mainCanvas,
        mainBox.left * scaleX,
        mainBox.top * scaleY,
        mainBox.width * scaleX,
        mainBox.height * scaleY
      );
    }
  }

  // 5. 最終画像の取得
  const finalPngDataUrl = offscreen.toDataURL("image/png");

  // 6. オフスクリーンメモリの解放
  offscreen.width = 0;
  offscreen.height = 0;
  img.src = "";

  return finalPngDataUrl;
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
