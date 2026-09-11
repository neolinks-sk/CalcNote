"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Stroke, StrokePoint, StrokeTarget } from "@/types";
import { useCalcStore } from "@/store/useCalcStore";
import { generateId } from "@/utils/id";

interface DrawingCanvasProps {
  /** 描画対象レイヤー（"header" = タイトル固定部, "main" = 計算式スクロール部） */
  target?: StrokeTarget;
}

/**
 * 分割配置された手書き描画キャンバス層。
 * - target="header": タイトルヘッダー領域に固定配置され、計算行がスクロールしても固定されたまま表示。
 * - target="main": スクロールコンテナのコンテンツ領域直下に配置され、計算行DOMと一緒に自然にスクロール。
 * - points は 0〜1 の相対座標で管理され、画面幅変化や行増減による全高変化にも正確に追従。
 * - テキスト操作モード時は pointer-events: none となり、下層の入力やスクロールを一切阻害しない。
 */
export default function DrawingCanvas({ target = "main" }: DrawingCanvasProps) {
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

  const isDrawMode = mode === "draw";

  // 自レイヤーに属するストロークのみを抽出
  const getStrokes = useCallback((): Stroke[] => {
    if (!strokeData) return [];
    try {
      const parsed = JSON.parse(strokeData);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((s: Stroke) => {
        if (target === "header") {
          return s.target === "header";
        }
        return s.target === "main" || !s.target;
      });
    } catch {
      return [];
    }
  }, [strokeData, target]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = container.parentElement;
    const width = Math.max(
      container.offsetWidth || 0,
      parent?.scrollWidth || 0,
      parent?.offsetWidth || 0,
      target === "header" ? 200 : 300
    );
    const height = Math.max(
      container.offsetHeight || 0,
      parent?.scrollHeight || 0,
      parent?.offsetHeight || 0,
      target === "header" ? 40 : 150
    );

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const targetW = Math.max(1, Math.round(width * dpr));
    const targetH = Math.max(1, Math.round(height * dpr));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      stroke.points.forEach((p: StrokePoint, i: number) => {
        // 相対座標（0〜1）に現在のCanvas寸法を乗算
        const x = p.x * width;
        const y = p.y <= 1.0 ? p.y * height : p.y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    getStrokes().forEach(drawStroke);
    if (drawingStrokeRef.current) drawStroke(drawingStrokeRef.current);
  }, [getStrokes, target]);

  // 親要素・コンテナのリサイズ監視
  useEffect(() => {
    const container = containerRef.current;
    const parent = container?.parentElement;
    if (!container) return;

    redraw();
    const ro = new ResizeObserver(() => {
      redraw();
    });

    ro.observe(container);
    if (parent) {
      ro.observe(parent);
    }

    return () => ro.disconnect();
  }, [redraw]);

  // シート切り替え・データ変更時の再描画
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

  // ポインタ座標を0〜1の相対座標に変換
  const relativePoint = (e: ReactPointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawMode) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    drawingStrokeRef.current = {
      id: generateId("stroke"),
      color: penColor,
      width: penWidth,
      target,
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
    if (!isDrawMode) return;
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
      aria-hidden={!isDrawMode}
    >
      <canvas
        ref={canvasRef}
        data-canvas-target={target}
        className="block h-full w-full"
        style={{
          touchAction: isDrawMode ? "none" : "auto",
          pointerEvents: isDrawMode ? "auto" : "none",
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
