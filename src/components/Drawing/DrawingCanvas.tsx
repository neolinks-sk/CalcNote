"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Stroke, StrokePoint } from "@/types";
import { useCalcStore } from "@/store/useCalcStore";
import { generateId } from "@/utils/id";

/**
 * 履歴エリアに重ね合わせる透明な手書き描画キャンバス層。
 * - points は 0〜1 の相対座標で保存するため、リサイズやスクロールによる位置ズレが起きない。
 * - テキスト操作モード中は pointer-events を無効化し、下層のメモ入力等の操作を妨げない。
 */
export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);

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

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      stroke.points.forEach((p: StrokePoint, i: number) => {
        const x = p.x * w;
        const y = p.y * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    getStrokes().forEach(drawStroke);
    if (drawingStrokeRef.current) drawStroke(drawingStrokeRef.current);
  }, [getStrokes]);

  // キャンバスの実サイズ（バッキングストア）をコンテナのCSSサイズ + devicePixelRatioに追従させる
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      redraw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  // 保存データ or シート切り替え時に再描画
  useEffect(() => {
    redraw();
  }, [redraw, currentSheetId, hasHydrated]);

  const relativePoint = (e: ReactPointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
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
      points: [relativePoint(e)],
    };
    redraw();
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !drawingStrokeRef.current) return;
    e.preventDefault();
    drawingStrokeRef.current.points.push(relativePoint(e));
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
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden={mode !== "draw"}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{
          touchAction: "none",
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
