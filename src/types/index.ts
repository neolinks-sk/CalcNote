// ============================================================
// CalcNote 型定義
// ============================================================

/** 四則演算子 */
export type Operator = "+" | "-" | "×" | "÷";

/** 手書きモード / テキスト操作モード */
export type DrawMode = "text" | "draw";

/**
 * 手書きストローク（1画分）
 * points は Canvas 要素サイズに対する相対座標 (0〜1) で保持し、
 * どんな画面サイズ・スクロール位置でも位置ズレなく再描画できるようにする。
 */
export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: StrokePoint[];
}

/**
 * 計算行単位（1行 = 1つの独立した計算式）
 */
export interface HistoryItem {
  /** 必須, ユニークID */
  id: string;
  /** 必須, 計算式文字列（例: "8500 - 600" や "12000"） */
  rawInput: string;
  /** 必須, 計算結果数値（0除算などのエラー時は NaN） */
  result: number;
  /** 必須, 「＝」が押されて計算結果が表示・確定されているかどうか */
  isEvaluated: boolean;
  /** 任意, メモ文字列（最大100文字） */
  memo: string;
  /** 必須, 表示順序 */
  order: number;
}

/**
 * シート単位（計算 + 手書きデータの保存単位）
 */
export interface Sheet {
  /** 必須, ユニークID */
  id: string;
  /** 必須, シート名 */
  title: string;
  /** 必須, ISO8601形式 */
  createdAt: string;
  /** 必須, ISO8601形式 */
  updatedAt: string;
  /** 必須, 計算行の配列 */
  items: HistoryItem[];
  /** 任意, 手書き描画データ（Stroke[] を JSON.stringify したもの） */
  strokeData?: string;
}

/** ペンの色プリセット */
export interface PenColorPreset {
  id: string;
  label: string;
  color: string;
}

/** ペンの太さプリセット */
export interface PenWidthPreset {
  id: string;
  label: string;
  width: number;
}
