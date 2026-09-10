import type { PenColorPreset, PenWidthPreset, Sheet } from "@/types";
import { generateId } from "@/utils/id";
import { makeArrowStrokes, makeCircleStroke } from "@/utils/demoStrokes";

export const SITE_URL = "https://hit-tool.com/calcnote";
export const APP_NAME = "CalcNote";
export const CREDIT_TEXT = "Created with CalcNote | hit-tool.com/calcnote";

export const PEN_COLORS: PenColorPreset[] = [
  { id: "red", label: "赤（強調）", color: "#ef4444" },
  { id: "blue", label: "青", color: "#3b82f6" },
  { id: "yellow", label: "蛍光イエロー", color: "#eeff00" },
  { id: "black", label: "黒", color: "#1f2937" },
];

export const PEN_WIDTHS: PenWidthPreset[] = [
  { id: "thin", label: "細", width: 3 },
  { id: "medium", label: "中", width: 6 },
  { id: "thick", label: "太", width: 10 },
];

export const HISTORY_AREA_MIN_HEIGHT = 280;

/**
 * 初回アクセス時に読み込むデモシート。
 */
export function createDemoSheet(): Sheet {
  const now = new Date().toISOString();

  return {
    id: generateId("sheet"),
    title: "タップでタイトル変更",
    createdAt: now,
    updatedAt: now,
    strokeData: undefined,
    items: [
      {
        id: generateId("item"),
        rawInput: "520 + 635",
        result: 1155,
        isEvaluated: true,
        memo: "",
        order: 0,
      },
      {
        id: generateId("item"),
        rawInput: "1155 - 560",
        result: 595,
        isEvaluated: true,
        memo: "自由にメモを入力",
        order: 1,
      },
      {
        id: generateId("item"),
        rawInput: "595",
        result: 595,
        isEvaluated: false, // 単一数値（引き継ぎ直後）なので結果「=」は非表示
        memo: "",
        order: 2,
      },
    ],
  };
}
