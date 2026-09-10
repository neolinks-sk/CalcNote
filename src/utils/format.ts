/**
 * 数値表示用フォーマット関連ユーティリティ
 */

/** 結果がエラー（0除算等）かどうか判定 */
export function isErrorResult(value: number): boolean {
  return Number.isNaN(value) || !Number.isFinite(value);
}

/** 3桁区切りの数値文字列に変換する（小数点以下は最大10桁まで保持） */
export function formatNumber(value: number): string {
  if (isErrorResult(value)) return "Error";
  // 浮動小数点誤差を丸める
  const rounded = Math.round(value * 1e8) / 1e8;
  return rounded.toLocaleString("ja-JP", { maximumFractionDigits: 8 });
}

/**
 * テンキーで入力中の数値文字列（まだ数値化していない）を
 * 3桁区切りにして表示するためのフォーマッタ。
 * 末尾の "." や "0" 入力途中の状態を壊さないよう文字列ベースで処理する。
 */
export function formatInputDisplay(raw: string): string {
  if (raw === "") return "0";
  const negative = raw.startsWith("-");
  const body = negative ? raw.slice(1) : raw;
  const [intPart, decPart] = body.split(".");
  const intFormatted = intPart === "" ? "0" : Number(intPart).toLocaleString("ja-JP");
  const decSuffix = decPart !== undefined ? `.${decPart}` : body.endsWith(".") ? "." : "";
  return `${negative ? "-" : ""}${intFormatted}${decSuffix}`;
}

/** 演算子付きの行入力表示文字列を組み立てる ("+ 1,200" など) */
export function buildRawInputLabel(operator: string | null, valueDisplay: string): string {
  return operator ? `${operator} ${valueDisplay}` : valueDisplay;
}

/** 日付を "2026/09/09 15:30" 形式に整形 */
export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
