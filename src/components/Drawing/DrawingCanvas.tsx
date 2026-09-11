"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { Stroke, StrokePoint } from "@/types";
import { useCalcStore } from "@/store/useCalcStore";
import { generateId } from "@/utils/id";

interface DrawingCanvasProps {
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  headerRef?: RefObject<HTMLDivElement | null>;
}

/**
 * タイトル領域（ヘッダー）と計算式スクロール領域を包括する手書き描画キャンバス層。
 * - 親コンテナ全体（タイトル＋計算式エリア）をカバーするよう配置。
 * - 計算式エリアのスクロール量（scrollTop）を検知し、ctx.translate でリスト描画を完全同期。
 * - ヘッダー領域に描かれた手書きはタイトル部に固定され、スクロールしてもずれない。
 * - リスト領域に描かれた手書きは計算式要素と一緒にスムーズにスクロールする。
 * - テキスト操作モード時は pointer-events: none となり、下層の入力・操作・スクロールを阻害しない。
 */
export default function DrawingCanvas({ scrollContainerRef, headerRef }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const mode = useCalcStore((s) => s.mode);
  const penColor = useCalcStore((s) => s.penColor);
  const penWidth = useCalcStore((s) => s.penWidth);
  const currentSheetId = useCalcStore((s) => s.currentSheetId);
  const strokeData = useCalcStore((s) => s.getCurrentSheet()?.strokeData);
  const addStroke = useCalcStore((s) => s.addStroke);
  const hasHydrated = useCalcStore((s) => s.hasHydrated);

  const getStrokes = useCallback((): Stroke[] => {
    if (!strokeData) return [];
    try {
      const parsed = JSON.parse(strokeData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [strokeData]);

  // ヘッダー高さとスクロール量の取得
  const getLayoutMetrics = useCallback(() => {
    const headerEl = headerRef?.current;
    const scrollEl = scrollContainerRef?.current;
    const containerEl = containerRef.current;

    const headerHeight = headerEl?.offsetHeight || 0;
    const scrollTop = scrollEl?.scrollTop || 0;
    const scrollHeight = scrollEl?.scrollHeight || 0;
    const containerWidth = containerEl?.offsetWidth || 300;
    const containerHeight = containerEl?.offsetHeight || 200;
    const totalDocHeight = headerHeight + scrollHeight;

    return {
      headerHeight,
      scrollTop,
      scrollHeight,
      containerWidth,
      containerHeight,
      totalDocHeight,
    };
  }, [headerRef, scrollContainerRef]);

  // ストローク描画ヘルパー
  const drawStrokePath = (
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    width: number,
    docTotalHeight: number
  ) => {
    if (stroke.points.length === 0) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    stroke.points.forEach((p: StrokePoint, i: number) => {
      const x = p.x * width;
      // 後方互換性：過去の 0.0〜1.0 相対座標データの場合はドキュメント全高を乗算
      const y = p.y <= 1.0 ? p.y * docTotalHeight : p.y;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { headerHeight, scrollTop, containerWidth, containerHeight, totalDocHeight } =
      getLayoutMetrics();

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const canvasCssWidth = containerWidth;
    const canvasCssHeight = containerHeight;

    // バッキングストア解像度の同期
    const targetW = Math.max(1, Math.round(canvasCssWidth * dpr));
    const targetH = Math.max(1, Math.round(canvasCssHeight * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    // DPR スケーリング
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const allStrokes = getStrokes();
    const currentDrawing = drawingStrokeRef.current;

    // パス1: ヘッダー（タイトル部）領域の描画
    // ヘッダー領域に描かれた手書きはスクロールの影響を受けず画面上部に固定
    if (headerHeight > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvasCssWidth, headerHeight);
      ctx.clip();

      allStrokes.forEach((s) => drawStrokePath(ctx, s, canvasCssWidth, totalDocHeight));
      if (currentDrawing) drawStrokePath(ctx, currentDrawing, canvasCssWidth, totalDocHeight);
      ctx.restore();
    }

    // パス2: 計算式スクロール領域の描画
    // 計算式エリアに描かれた手書きは scrollTop に応じて ctx.translate(0, -scrollTop) で完全追従
    const listAreaHeight = Math.max(0, canvasCssHeight - headerHeight);
    if (listAreaHeight > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, headerHeight, canvasCssWidth, listAreaHeight);
      ctx.clip();

      ctx.translate(0, -scrollTop);
      allStrokes.forEach((s) => drawStrokePath(ctx, s, canvasCssWidth, totalDocHeight));
      if (currentDrawing) drawStrokePath(ctx, currentDrawing, canvasCssWidth, totalDocHeight);
      ctx.restore();
    }
  }, [getStrokes, getLayoutMetrics]);

  // スクロール時のリアルタイム再描画同期
  useEffect(() => {
    const scrollEl = scrollContainerRef?.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        redraw();
      });
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [scrollContainerRef, redraw]);

  // リサイズ監視（コンテナ・スクロール要素・ヘッダー要素）
  useEffect(() => {
    const container = containerRef.current;
    const scrollEl = scrollContainerRef?.current;
    const headerEl = headerRef?.current;
    if (!container) return;

    redraw();
    const ro = new ResizeObserver(() => {
      redraw();
    });

    ro.observe(container);
    if (scrollEl) ro.observe(scrollEl);
    if (headerEl) ro.observe(headerEl);

    return () => ro.disconnect();
  }, [scrollContainerRef, headerRef, redraw]);

  // シート切り替えやデータ変更時の再描画
  useEffect(() => {
    redraw();
  }, [redraw, currentSheetId, hasHydrated]);

  // 画像エクスポート時等の強制再描画イベント
  useEffect(() => {
    const handleForceRedraw = () => {
      redraw();
    };

    window.addEventListener("calcnote:force-redraw-canvas", handleForceRedraw);
    return () => window.removeEventListener("calcnote:force-redraw-canvas", handleForceRedraw);
  }, [redraw]);

  // ポインタ座標をドキュメント論理座標系に変換
  const getDocumentPoint = (e: ReactPointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { headerHeight, scrollTop } = getLayoutMetrics();

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Xはコンテナ幅に対する0〜1の比率
    const x = Math.min(1, Math.max(0, screenX / (rect.width || 1)));

    // Yはドキュメント絶対px座標（ヘッダー領域ならscreenY、リスト領域ならscreenY + scrollTop）
    let docY: number;
    if (screenY < headerHeight) {
      docY = Math.max(0, screenY);
    } else {
      docY = Math.max(headerHeight, screenY + scrollTop);
    }

    return { x, y: docY };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    drawingStrokeRef.current = {
      id: generateId("stroke"),
      color: penColor,
      width: penWidth,
      points: [getDocumentPoint(e)],
    };
    redraw();
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !drawingStrokeRef.current) return;
    e.preventDefault();
    drawingStrokeRef.current.points.push(getDocumentPoint(e));
    redraw();
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const stroke = drawingStrokeRef.current;
    drawingStrokeRef.current = null;
    if (stroke && stroke.points.length > 1) {
      addStroke(stroke);
    } else {
      redraw();
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    e.preventDefault();
    finishStroke();
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
      aria-hidden={mode !== "draw"}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{
          touchAction: mode === "draw" ? "none" : "auto",
          pointerEvents: mode === "draw" ? "auto" : "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
