"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Stroke, StrokePoint } from "@/types";
import { useCalcStore } from "@/store/useCalcStore";
import { generateId } from "@/utils/id";

/**
 * 計算式エリア（スクロールコンテナ）の内部に重ね合わせる手書き描画キャンバス層。
 * - 計算式リスト（DOM）と同じスクロール親要素の直下に配置されるため、スクロールしても位置がずれない。
 * - points は 0〜1 の相対座標で保存・描画するため、リサイズや行増減による全高変化にも正確に追従する。
 * - テキスト操作モード中は pointer-events を無効化（none）し、下層の計算式・メモ入力・スクロールを妨げない。
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

  // キャンバスの実サイズ（バッキングストア）とCSSサイズを、スクロール可能な全体サイズに完全同期
  const updateCanvasDimensionsAndRedraw = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const parent = container.parentElement;
    const width = Math.max(
      container.offsetWidth || 0,
      parent?.scrollWidth || 0,
      parent?.offsetWidth || 0,
      300
    );
    const height = Math.max(
      container.offsetHeight || 0,
      parent?.scrollHeight || 0,
      parent?.offsetHeight || 0,
      200
    );

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    redraw();
  }, [redraw]);

  // リサイズ監視（コンテナおよび親要素のサイズ変化に追従）
  useEffect(() => {
    const container = containerRef.current;
    const parent = container?.parentElement;
    if (!container) return;

    updateCanvasDimensionsAndRedraw();
    const ro = new ResizeObserver(() => {
      updateCanvasDimensionsAndRedraw();
    });

    ro.observe(container);
    if (parent) {
      ro.observe(parent);
    }
    return () => ro.disconnect();
  }, [updateCanvasDimensionsAndRedraw]);

  // 保存データ or シート切り替え時に再描画
  useEffect(() => {
    redraw();
  }, [redraw, currentSheetId, hasHydrated]);

  // 画像エクスポート時等の強制再描画イベントを購読
  useEffect(() => {
    const handleForceRedraw = () => {
      updateCanvasDimensionsAndRedraw();
    };

    window.addEventListener("calcnote:force-redraw-canvas", handleForceRedraw);
    return () => window.removeEventListener("calcnote:force-redraw-canvas", handleForceRedraw);
  }, [updateCanvasDimensionsAndRedraw]);

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
      className="pointer-events-none absolute inset-0 z-20"
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
