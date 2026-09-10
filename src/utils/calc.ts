import type { HistoryItem, Operator } from "@/types";

/** 0除算や計算不能なエラー結果かを判定 */
export function isErrorResult(value: number): boolean {
  return Number.isNaN(value) || !Number.isFinite(value);
}

/** 式に演算子 (+, -, ×, ÷, *, /) が含まれているかを判定（先頭の単項マイナスのみの場合は単一数値とみなす） */
export function hasOperator(expr: string): boolean {
  if (!expr) return false;
  const trimmed = expr.trim();
  // 先頭の "-" や "+" を除外した部分に演算子があるか判定
  const withoutLeadingSign = trimmed.replace(/^[\+\-]/, "").trim();
  return /[\+\-\×\÷\*\/\−]/.test(withoutLeadingSign);
}

/**
 * 1行の数式文字列（例: "8500 - 600", "12000", "100 + 50 × 2"）を安全に計算・評価する。
 * - 0除算や不正な構文の場合は NaN を返す。
 * - 入力途中の末尾演算子（例: "8500 - "）は末尾を取り除いて手前の有効な計算結果をプレビューする。
 */
export function evaluateExpression(expr: string): number {
  if (!expr || expr.trim() === "") return 0;

  // カンマ、全角演算子、Unicodeマイナスを正規化
  let clean = expr
    .replace(/,/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .trim();

  // 入力途中で末尾が演算子や空白で終わっている場合、末尾の演算子を取り除いて計算
  clean = clean.replace(/[\+\-\*\/\s]+$/, "");
  if (clean === "") return 0;

  // トークナイザー
  const tokens: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const ch = clean[i];
    if (ch === " ") {
      i++;
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "(" || ch === ")") {
      tokens.push(ch);
      i++;
    } else if (/\d|\./.test(ch)) {
      let numStr = "";
      while (i < clean.length && /\d|\./.test(clean[i])) {
        numStr += clean[i];
        i++;
      }
      tokens.push(numStr);
    } else {
      // 予期せぬ文字が含まれる場合は計算不能
      return NaN;
    }
  }

  let pos = 0;

  function parseExpr(): number {
    let val = parseTerm();
    while (pos < tokens.length && (tokens[pos] === "+" || tokens[pos] === "-")) {
      const op = tokens[pos++];
      const nextVal = parseTerm();
      if (Number.isNaN(val) || Number.isNaN(nextVal)) return NaN;
      if (op === "+") val += nextVal;
      else val -= nextVal;
    }
    return val;
  }

  function parseTerm(): number {
    let val = parseFactor();
    while (pos < tokens.length && (tokens[pos] === "*" || tokens[pos] === "/")) {
      const op = tokens[pos++];
      const nextVal = parseFactor();
      if (Number.isNaN(val) || Number.isNaN(nextVal)) return NaN;
      if (op === "*") {
        val *= nextVal;
      } else {
        if (nextVal === 0) return NaN; // 0除算
        val /= nextVal;
      }
    }
    return val;
  }

  function parseFactor(): number {
    if (pos >= tokens.length) return NaN;

    // 単項演算子 (+ または -)
    let sign = 1;
    if (tokens[pos] === "+") {
      pos++;
    } else if (tokens[pos] === "-") {
      sign = -1;
      pos++;
    }

    if (pos >= tokens.length) return NaN;

    const token = tokens[pos++];
    if (token === "(") {
      const val = parseExpr();
      if (pos < tokens.length && tokens[pos] === ")") {
        pos++;
      }
      return sign * val;
    }

    const n = Number(token);
    if (Number.isNaN(n)) return NaN;
    return sign * n;
  }

  try {
    const res = parseExpr();
    if (Number.isNaN(res) || !Number.isFinite(res)) return NaN;
    return Math.round(res * 1e10) / 1e10;
  } catch {
    return NaN;
  }
}

/**
 * テンキーで数字が押された時の式更新
 */
export function appendDigitToExpression(current: string, digit: string): string {
  if (current === "" || current === "0") {
    if (digit === ".") return "0.";
    if (digit === "0") return "0";
    return digit;
  }

  if (digit === ".") {
    const segments = current.split(/[\+\-\×\÷\*\/\s\(\)]+/);
    const lastSeg = segments[segments.length - 1];
    if (lastSeg.includes(".")) return current;
    if (lastSeg === "") return current + "0.";
    return current + ".";
  }

  return current + digit;
}

/**
 * テンキーで演算子（+ , - , × , ÷）が押された時の式更新
 */
export function appendOperatorToExpression(current: string, op: Operator): string {
  const symbol = op;

  if (current === "" || current === "0") {
    if (op === "-") return "-";
    return "0 " + symbol + " ";
  }

  // 末尾が演算子（スペース付き含む）で終わっている場合は置換
  if (/\s*[\+\-\×\÷\*\/\−]\s*$/.test(current)) {
    return current.replace(/\s*[\+\-\×\÷\*\/\−]\s*$/, ` ${symbol} `);
  }

  // それ以外は前後にスペースを入れて追加
  return `${current} ${symbol} `;
}

/**
 * バックスペース（⌫）押下時の式更新
 */
export function backspaceExpression(current: string): string {
  if (!current) return "";
  // 末尾が " - " や " +" などの演算子の場合は演算子とスペースを一括削除
  if (/\s*[\+\-\×\÷\*\/\−]\s*$/.test(current)) {
    return current.replace(/\s*[\+\-\×\÷\*\/\−]\s*$/, "");
  }
  return current.slice(0, -1);
}

/**
 * 各行の独立した計算評価（全行の再計算）
 */
export function recalcItems(items: HistoryItem[]): HistoryItem[] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  return sorted.map((item, index) => {
    const result = evaluateExpression(item.rawInput);
    return {
      ...item,
      order: index,
      result,
    };
  });
}
