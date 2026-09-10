/**
 * バリデーション関連ユーティリティ
 */

export const MEMO_MAX_LENGTH = 100;
export const DEFAULT_SHEET_TITLE = "無題のシート";

/** シートタイトル: 空文字不可（デフォルト名を補填） */
export function sanitizeSheetTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed === "" ? DEFAULT_SHEET_TITLE : trimmed.slice(0, 60);
}

/** メモ入力: 最大100文字に丸める */
export function sanitizeMemo(memo: string): string {
  return memo.slice(0, MEMO_MAX_LENGTH);
}

/** 数値入力文字列を安全に number へ変換する */
export function parseNumericInput(raw: string): number {
  if (raw === "" || raw === ".") return 0;
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
}
