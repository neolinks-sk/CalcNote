import type { Stroke, StrokePoint } from "@/types";
import { generateId } from "./id";

/**
 * 円（手書きの丸囲み風）のストロークを生成する。
 * cx, cy, rx, ry はすべて Canvas に対する相対座標 (0〜1)。
 */
export function makeCircleStroke(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  width: number
): Stroke {
  const points: StrokePoint[] = [];
  const steps = 28;
  // 手書き感を出すため、始点と終点を少しずらして一周からはみ出させる
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 + Math.PI * 0.1;
    const wobble = 1 + Math.sin(i * 1.7) * 0.03;
    points.push({
      x: cx + Math.cos(t) * rx * wobble,
      y: cy + Math.sin(t) * ry * wobble,
    });
  }
  return { id: generateId("stroke"), color, width, points };
}

/**
 * 矢印のストロークを生成する（軸線 + 矢じり）。
 * 複数の Stroke を返すため配列で返却する。
 */
export function makeArrowStrokes(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): Stroke[] {
  const shaft: Stroke = {
    id: generateId("stroke"),
    color,
    width,
    points: [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ],
  };

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 0.035;
  const headAngle = Math.PI / 7;

  const head1: Stroke = {
    id: generateId("stroke"),
    color,
    width,
    points: [
      { x: x2, y: y2 },
      {
        x: x2 - headLen * Math.cos(angle - headAngle),
        y: y2 - headLen * Math.sin(angle - headAngle),
      },
    ],
  };
  const head2: Stroke = {
    id: generateId("stroke"),
    color,
    width,
    points: [
      { x: x2, y: y2 },
      {
        x: x2 - headLen * Math.cos(angle + headAngle),
        y: y2 - headLen * Math.sin(angle + headAngle),
      },
    ],
  };

  return [shaft, head1, head2];
}
