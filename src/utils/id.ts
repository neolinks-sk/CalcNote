/**
 * 環境に依存しないユニークID生成。
 * crypto.randomUUID が使用できない古い環境向けにフォールバックを用意する。
 */
export function generateId(prefix = ""): string {
  const hasCrypto =
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function";

  const raw = hasCrypto
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

  return prefix ? `${prefix}_${raw}` : raw;
}
