import { create, type StoreApi } from "zustand";
import { persist, createJSONStorage, type PersistStorage } from "zustand/middleware";
import type { DrawMode, Operator, Sheet, Stroke, HistoryItem } from "@/types";
import { generateId } from "@/utils/id";
import {
  appendDigitToExpression,
  appendOperatorToExpression,
  backspaceExpression,
  evaluateExpression,
  hasOperator,
  isErrorResult,
  recalcItems,
} from "@/utils/calc";
import { sanitizeMemo, sanitizeSheetTitle } from "@/utils/validation";
import { createDemoSheet, PEN_COLORS, PEN_WIDTHS } from "@/constants";

const STORAGE_KEY = "calcnote-storage";
const ZERO_DIVISION_MESSAGE = "0で割ることはできません";

interface PersistedState {
  sheets: Sheet[];
  currentSheetId: string | null;
  isSampleState: boolean;
  dismissedTooltips?: {
    draw?: boolean;
    memo?: boolean;
    carryOver?: boolean;
    newSheet?: boolean;
  };
}

interface CalcState extends PersistedState {
  // --- 一時的な計算機状態（永続化しない） ---
  activeItemId: string | null;
  errorMessage: string | null;
  hasHydrated: boolean;
  isAllClearModalOpen: boolean;
  isKeypadVisible: boolean;

  // --- 手書きツール状態（永続化しない） ---
  mode: DrawMode;
  penColor: string;
  penWidth: number;

  // --- セレクタ的ヘルパー ---
  getCurrentSheet: () => Sheet | undefined;
  getCurrentStrokes: () => Stroke[];

  // --- サンプルガイド案内 ---
  dismissSampleGuide: () => void;
  dismissTooltip: (name: "draw" | "memo" | "carryOver" | "newSheet") => void;

  // --- シート管理 ---
  createSheet: (title?: string) => void;
  deleteSheet: (id: string) => void;
  selectSheet: (id: string) => void;
  renameSheet: (id: string, title: string) => void;
  saveCurrentSheet: () => void;

  // --- アクティブ行の選択 ---
  setActiveItemId: (id: string | null) => void;
  clearActiveItem: () => void;

  // --- テンキーからのダイレクト操作 ---
  pressDigit: (d: string) => void;
  pressOperator: (op: Operator) => void;
  pressEquals: () => void;
  pressClear: () => void;
  pressAllClear: () => void;
  pressBackspace: () => void;

  // --- オールクリア確認モーダル ---
  openAllClearModal: () => void;
  closeAllClearModal: () => void;
  confirmAllClear: () => void;

  // --- 行引き継ぎ・編集 ---
  carryOverResult: (itemId: string) => void;
  addNewLine: (afterItemId?: string) => void;
  updateItemValue: (itemId: string, rawValue: string) => void;
  updateItemMemo: (itemId: string, memo: string) => void;
  deleteItem: (itemId: string) => void;

  // --- 手書きデータ ---
  setStrokeData: (strokeData: string) => void;
  addStroke: (stroke: Stroke) => void;
  undoLastStroke: () => void;
  clearStrokes: () => void;

  // --- 手書きツール設定 ---
  setMode: (mode: DrawMode) => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;

  // --- テンキー表示切替 ---
  toggleKeypad: () => void;
  setKeypadVisible: (visible: boolean) => void;

  clearErrorMessage: () => void;
  setHasHydrated: (v: boolean) => void;
}

/** localStorage 破損時にもアプリ全体をクラッシュさせないための安全なストレージラッパー */
function createSafeStorage(): PersistStorage<PersistedState> {
  const base = createJSONStorage<PersistedState>(() => localStorage);
  return {
    getItem: (name) => {
      try {
        return base?.getItem(name) ?? null;
      } catch (e) {
        console.warn("[CalcNote] localStorageの読み込みに失敗しました。初期状態で復旧します。", e);
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        base?.setItem(name, value);
      } catch (e) {
        console.warn("[CalcNote] localStorageへの保存に失敗しました。", e);
      }
    },
    removeItem: (name) => {
      try {
        base?.removeItem(name);
      } catch {
        // noop
      }
    },
  };
}

function touch(sheet: Sheet): Sheet {
  return { ...sheet, updatedAt: new Date().toISOString() };
}

/** 手書きデータの読み込みに失敗しても落ちないように安全にパースする */
function parseStrokes(strokeData: string | undefined): Stroke[] {
  if (!strokeData) return [];
  try {
    const parsed = JSON.parse(strokeData);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn("[CalcNote] 手書きデータの読み込みに失敗しました。テキストのみ復旧します。", e);
    return [];
  }
}

/** アクティブ行、または最後の行を特定するヘルパー */
function findTargetItem(sheet: Sheet, activeItemId: string | null): HistoryItem | null {
  if (sheet.items.length === 0) return null;
  if (activeItemId) {
    const found = sheet.items.find((i) => i.id === activeItemId);
    if (found) return found;
  }
  return sheet.items[sheet.items.length - 1];
}

let storeApi: StoreApi<CalcState> | null = null;

export const useCalcStore = create<CalcState>()(
  persist(
    (set, get, api) => {
      storeApi = api;
      return {
        sheets: [],
        currentSheetId: null,
        activeItemId: null,
        errorMessage: null,
        hasHydrated: false,
        isAllClearModalOpen: false,
        isSampleState: false,
        isKeypadVisible: true,
        dismissedTooltips: {},
        mode: "text",
        penColor: PEN_COLORS[0].color,
        penWidth: PEN_WIDTHS[1].width,

        getCurrentSheet: () => {
          const { sheets, currentSheetId } = get();
          return sheets.find((s) => s.id === currentSheetId);
        },

        getCurrentStrokes: () => {
          const sheet = get().sheets.find((s) => s.id === get().currentSheetId);
          return parseStrokes(sheet?.strokeData);
        },

        dismissSampleGuide: () =>
          set({
            isSampleState: false,
            dismissedTooltips: { draw: true, memo: true, carryOver: true, newSheet: true },
          }),

        dismissTooltip: (name: "draw" | "memo" | "carryOver" | "newSheet") =>
          set((state) => ({
            dismissedTooltips: {
              ...state.dismissedTooltips,
              [name]: true,
            },
          })),

        createSheet: (title) => {
          const now = new Date().toISOString();
          const initialItem: HistoryItem = {
            id: generateId("item"),
            rawInput: "",
            result: 0,
            isEvaluated: false,
            memo: "",
            order: 0,
          };
          const sheet: Sheet = {
            id: generateId("sheet"),
            title: sanitizeSheetTitle(title ?? ""),
            createdAt: now,
            updatedAt: now,
            items: [initialItem],
            strokeData: undefined,
          };
          set((state) => ({
            sheets: [...state.sheets, sheet],
            currentSheetId: sheet.id,
            activeItemId: initialItem.id,
            errorMessage: null,
            isSampleState: false,
            dismissedTooltips: { draw: true, memo: true, carryOver: true, newSheet: true },
          }));
        },

        deleteSheet: (id) => {
          set((state) => {
            const remaining = state.sheets.filter((s) => s.id !== id);
            let nextCurrentId = state.currentSheetId;
            let nextSheets = remaining;

            if (state.currentSheetId === id) {
              if (remaining.length > 0) {
                nextCurrentId = remaining[0].id;
              } else {
                const fresh = createDemoSheet();
                nextSheets = [fresh];
                nextCurrentId = fresh.id;
              }
            }

            const nextSheet = nextSheets.find((s) => s.id === nextCurrentId);
            const nextActiveId =
              nextSheet && nextSheet.items.length > 0
                ? nextSheet.items[nextSheet.items.length - 1].id
                : null;

            return {
              sheets: nextSheets,
              currentSheetId: nextCurrentId,
              activeItemId: nextActiveId,
              errorMessage: null,
            };
          });
        },

        selectSheet: (id) => {
          set((state) => {
            const nextSheet = state.sheets.find((s) => s.id === id);
            if (!nextSheet) return state;
            const nextActiveId =
              nextSheet.items.length > 0
                ? nextSheet.items[nextSheet.items.length - 1].id
                : null;
            return { currentSheetId: id, activeItemId: nextActiveId, errorMessage: null };
          });
        },

        renameSheet: (id, title) => {
          set((state) => ({
            sheets: state.sheets.map((s) =>
              s.id === id ? touch({ ...s, title: title.slice(0, 60) }) : s
            ),
          }));
        },

        saveCurrentSheet: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;
            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? touch(s) : s)),
            };
          });
        },

        setActiveItemId: (id) => set({ activeItemId: id }),
        clearActiveItem: () => set({ activeItemId: null }),

        // テンキー押下時: アクティブ行の数式に直接数字を追加（＝が押されるまで結果は非表示）
        pressDigit: (d) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;

            if (sheet.items.length === 0) {
              const initialRaw = appendDigitToExpression("", d);
              const initialResult = evaluateExpression(initialRaw);
              const newItem: HistoryItem = {
                id: generateId("item"),
                rawInput: initialRaw,
                result: initialResult,
                isEvaluated: false,
                memo: "",
                order: 0,
              };
              const updatedSheet = touch({ ...sheet, items: [newItem] });
              return {
                ...state,
                sheets: state.sheets.map((s) => (s.id === sheet.id ? updatedSheet : s)),
                activeItemId: newItem.id,
                errorMessage: null,
              };
            }

            const targetItem = findTargetItem(sheet, state.activeItemId);
            if (!targetItem) return state;

            const nextRaw = appendDigitToExpression(targetItem.rawInput, d);
            const nextResult = evaluateExpression(nextRaw);

            const updatedItems = sheet.items.map((item) =>
              item.id === targetItem.id
                ? {
                    ...item,
                    rawInput: nextRaw,
                    result: nextResult,
                    isEvaluated: false, // 入力途中は非表示
                  }
                : item
            );

            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: updatedItems }) : s)),
              activeItemId: targetItem.id,
              errorMessage: isErrorResult(nextResult) ? ZERO_DIVISION_MESSAGE : null,
            };
          });
        },

        // テンキー押下時: 同じ行の数式に演算子（+ , - , × , ÷）を追加
        pressOperator: (op) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;

            if (sheet.items.length === 0) {
              const initialRaw = appendOperatorToExpression("", op);
              const initialResult = evaluateExpression(initialRaw);
              const newItem: HistoryItem = {
                id: generateId("item"),
                rawInput: initialRaw,
                result: initialResult,
                isEvaluated: false,
                memo: "",
                order: 0,
              };
              const updatedSheet = touch({ ...sheet, items: [newItem] });
              return {
                ...state,
                sheets: state.sheets.map((s) => (s.id === sheet.id ? updatedSheet : s)),
                activeItemId: newItem.id,
                errorMessage: null,
              };
            }

            const targetItem = findTargetItem(sheet, state.activeItemId);
            if (!targetItem) return state;

            const nextRaw = appendOperatorToExpression(targetItem.rawInput, op);
            const nextResult = evaluateExpression(nextRaw);

            const updatedItems = sheet.items.map((item) =>
              item.id === targetItem.id
                ? {
                    ...item,
                    rawInput: nextRaw,
                    result: nextResult,
                    isEvaluated: false, // 入力途中は非表示
                  }
                : item
            );

            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: updatedItems }) : s)),
              activeItemId: targetItem.id,
              errorMessage: isErrorResult(nextResult) ? ZERO_DIVISION_MESSAGE : null,
            };
          });
        },

        // 【重要】テンキーの「＝」押下時: 演算子が含まれている場合のみ計算結果を表示・確定（行追加はしない）
        pressEquals: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet || sheet.items.length === 0) return state;

            const targetItem = findTargetItem(sheet, state.activeItemId);
            if (!targetItem) return state;

            const nextResult = evaluateExpression(targetItem.rawInput);
            const shouldEvaluate = hasOperator(targetItem.rawInput);

            const updatedItems = sheet.items.map((item) =>
              item.id === targetItem.id
                ? {
                    ...item,
                    result: nextResult,
                    isEvaluated: shouldEvaluate,
                  }
                : item
            );

            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: updatedItems }) : s)),
              activeItemId: targetItem.id,
              errorMessage: isErrorResult(nextResult) ? ZERO_DIVISION_MESSAGE : null,
            };
          });
        },

        // 【重要】各行の「= 結果」部分タップ時のみの行引き継ぎ
        // その行の計算結果（数値）を初期値として持つ新しい独立行を作成
        // 単一数値として作成されるため、初期状態では結果を非表示（isEvaluated: false）とする
        carryOverResult: (itemId) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;

            const targetIndex = sheet.items.findIndex((i) => i.id === itemId);
            if (targetIndex === -1) return state;

            const targetItem = sheet.items[targetIndex];
            if (isErrorResult(targetItem.result)) {
              return state;
            }

            const carryValue = targetItem.result;
            const rawValStr = String(carryValue);

            const newItem: HistoryItem = {
              id: generateId("item"),
              rawInput: rawValStr,
              result: carryValue,
              isEvaluated: false, // 単一数値なので初期状態では結果を出さない
              memo: "",
              order: targetItem.order + 1,
            };

            const newItems = [...sheet.items];
            newItems.splice(targetIndex + 1, 0, newItem);
            const recalced = recalcItems(newItems);

            return {
              ...state,
              sheets: state.sheets.map((s) =>
                s.id === sheet.id ? touch({ ...s, items: recalced }) : s
              ),
              activeItemId: newItem.id,
              errorMessage: null,
            };
          });
        },

        addNewLine: (afterItemId) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;

            const targetIndex = afterItemId
              ? sheet.items.findIndex((i) => i.id === afterItemId)
              : sheet.items.length - 1;

            const newItem: HistoryItem = {
              id: generateId("item"),
              rawInput: "",
              result: 0,
              isEvaluated: false,
              memo: "",
              order: targetIndex >= 0 ? targetIndex + 1 : 0,
            };

            const newItems = [...sheet.items];
            if (targetIndex >= 0) {
              newItems.splice(targetIndex + 1, 0, newItem);
            } else {
              newItems.push(newItem);
            }
            const recalced = recalcItems(newItems);

            return {
              ...state,
              sheets: state.sheets.map((s) =>
                s.id === sheet.id ? touch({ ...s, items: recalced }) : s
              ),
              activeItemId: newItem.id,
            };
          });
        },

        pressClear: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet || sheet.items.length === 0) return state;
            const targetItem = findTargetItem(sheet, state.activeItemId);
            if (!targetItem) return state;

            const updatedItems = sheet.items.map((item) =>
              item.id === targetItem.id
                ? { ...item, rawInput: "", result: 0, isEvaluated: false }
                : item
            );
            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: updatedItems }) : s)),
              activeItemId: targetItem.id,
              errorMessage: null,
            };
          });
        },

        pressAllClear: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;

            const initialItem: HistoryItem = {
              id: generateId("item"),
              rawInput: "",
              result: 0,
              isEvaluated: false,
              memo: "",
              order: 0,
            };

            const isSample = state.isSampleState;
            const updatedSheet = touch({
              ...sheet,
              title: isSample ? "無題のシート" : sheet.title,
              items: [initialItem],
              strokeData: JSON.stringify([]),
            });

            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? updatedSheet : s)),
              activeItemId: initialItem.id,
              errorMessage: null,
              isSampleState: false,
              dismissedTooltips: { draw: true, memo: true, carryOver: true, newSheet: true },
            };
          });
        },

        openAllClearModal: () => {
          const sheet = get().getCurrentSheet();
          if (!sheet || (sheet.items.length === 0 && !sheet.strokeData)) return;
          set({ isAllClearModalOpen: true });
        },

        closeAllClearModal: () => set({ isAllClearModalOpen: false }),

        confirmAllClear: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return { ...state, isAllClearModalOpen: false, isSampleState: false, dismissedTooltips: { draw: true, memo: true, carryOver: true, newSheet: true } };

            const initialItem: HistoryItem = {
              id: generateId("item"),
              rawInput: "",
              result: 0,
              isEvaluated: false,
              memo: "",
              order: 0,
            };

            const isSample = state.isSampleState;
            const updatedSheet = touch({
              ...sheet,
              title: isSample ? "無題のシート" : sheet.title,
              items: [initialItem],
              strokeData: JSON.stringify([]),
            });

            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? updatedSheet : s)),
              activeItemId: initialItem.id,
              errorMessage: null,
              isAllClearModalOpen: false,
              isSampleState: false,
              dismissedTooltips: { draw: true, memo: true, carryOver: true, newSheet: true },
            };
          });
        },

        pressBackspace: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet || sheet.items.length === 0) return state;

            const targetItem = findTargetItem(sheet, state.activeItemId);
            if (!targetItem) return state;

            if (targetItem.rawInput.length > 0) {
              const nextRaw = backspaceExpression(targetItem.rawInput);
              const nextResult = evaluateExpression(nextRaw);
              const updatedItems = sheet.items.map((item) =>
                item.id === targetItem.id
                  ? { ...item, rawInput: nextRaw, result: nextResult, isEvaluated: false }
                  : item
              );
              return {
                ...state,
                sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: updatedItems }) : s)),
                activeItemId: targetItem.id,
                errorMessage: isErrorResult(nextResult) ? ZERO_DIVISION_MESSAGE : null,
              };
            } else {
              // すでに空行の場合で、複数行あれば行自体を削除して前の行に移動
              if (sheet.items.length > 1) {
                const targetIndex = sheet.items.findIndex((i) => i.id === targetItem.id);
                const prevItem =
                  targetIndex > 0 ? sheet.items[targetIndex - 1] : sheet.items[targetIndex + 1];
                const filtered = sheet.items.filter((item) => item.id !== targetItem.id);
                const recalced = recalcItems(filtered);
                return {
                  ...state,
                  sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: recalced }) : s)),
                  activeItemId: prevItem ? prevItem.id : null,
                };
              }
              return state;
            }
          });
        },

        updateItemValue: (itemId, rawValue) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;

            const nextResult = evaluateExpression(rawValue);
            const updatedItems = sheet.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    rawInput: rawValue,
                    result: nextResult,
                    isEvaluated: false, // 手入力時も確定までは結果を非表示
                  }
                : item
            );

            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: updatedItems }) : s)),
              activeItemId: itemId,
              errorMessage: isErrorResult(nextResult) ? ZERO_DIVISION_MESSAGE : null,
            };
          });
        },

        updateItemMemo: (itemId, memo) => {
          const safeMemo = sanitizeMemo(memo);
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;
            const updatedItems = sheet.items.map((item) =>
              item.id === itemId ? { ...item, memo: safeMemo } : item
            );
            return {
              ...state,
              sheets: state.sheets.map((s) =>
                s.id === sheet.id ? touch({ ...s, items: updatedItems }) : s
              ),
            };
          });
        },

        deleteItem: (itemId) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;
            const targetIndex = sheet.items.findIndex((i) => i.id === itemId);
            const filtered = sheet.items.filter((item) => item.id !== itemId);
            const recalced = recalcItems(filtered);

            let nextActiveId = state.activeItemId;
            if (state.activeItemId === itemId) {
              if (recalced.length > 0) {
                const nextIndex = Math.min(targetIndex, recalced.length - 1);
                nextActiveId = recalced[nextIndex].id;
              } else {
                nextActiveId = null;
              }
            }

            return {
              ...state,
              sheets: state.sheets.map((s) => (s.id === sheet.id ? touch({ ...s, items: recalced }) : s)),
              activeItemId: nextActiveId,
            };
          });
        },

        setStrokeData: (strokeData) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;
            return {
              ...state,
              sheets: state.sheets.map((s) =>
                s.id === sheet.id ? touch({ ...s, strokeData }) : s
              ),
            };
          });
        },

        addStroke: (stroke) => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;
            const strokes = parseStrokes(sheet.strokeData);
            strokes.push(stroke);
            return {
              ...state,
              sheets: state.sheets.map((s) =>
                s.id === sheet.id ? touch({ ...s, strokeData: JSON.stringify(strokes) }) : s
              ),
            };
          });
        },

        undoLastStroke: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;
            const strokes = parseStrokes(sheet.strokeData);
            if (strokes.length === 0) return state;
            strokes.pop();
            return {
              ...state,
              sheets: state.sheets.map((s) =>
                s.id === sheet.id ? touch({ ...s, strokeData: JSON.stringify(strokes) }) : s
              ),
            };
          });
        },

        clearStrokes: () => {
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === state.currentSheetId);
            if (!sheet) return state;
            return {
              ...state,
              sheets: state.sheets.map((s) =>
                s.id === sheet.id ? touch({ ...s, strokeData: JSON.stringify([]) }) : s
              ),
            };
          });
        },

        setMode: (mode) => {
          if (mode === "draw") {
            set({ mode, activeItemId: null });
          } else {
            set({ mode });
          }
        },
        setPenColor: (color) => set({ penColor: color }),
        setPenWidth: (width) => set({ penWidth: width }),
        toggleKeypad: () => set((state) => ({ isKeypadVisible: !state.isKeypadVisible })),
        setKeypadVisible: (visible) => set({ isKeypadVisible: visible }),
        clearErrorMessage: () => set({ errorMessage: null }),
        setHasHydrated: (v) => set({ hasHydrated: v }),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createSafeStorage(),
      partialize: (state) => ({
        sheets: state.sheets,
        currentSheetId: state.currentSheetId,
        isSampleState: state.isSampleState,
        dismissedTooltips: state.dismissedTooltips,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[CalcNote] 保存データの復元に失敗しました。初期状態を使用します。", error);
        }
        if (!state || state.sheets.length === 0) {
          const demo = createDemoSheet();
          const demoActiveId = demo.items.length > 0 ? demo.items[demo.items.length - 1].id : null;
          storeApi?.setState({
            sheets: [demo],
            currentSheetId: demo.id,
            activeItemId: demoActiveId,
            isSampleState: true,
            dismissedTooltips: {},
          });
        } else if (!state.sheets.some((s) => s.id === state.currentSheetId)) {
          const firstSheet = state.sheets[0];
          const firstActiveId =
            firstSheet.items.length > 0 ? firstSheet.items[firstSheet.items.length - 1].id : null;
          storeApi?.setState({
            currentSheetId: firstSheet.id,
            activeItemId: firstActiveId,
            isSampleState: state.isSampleState ?? false,
            dismissedTooltips: state.dismissedTooltips ?? {},
          });
        } else {
          // 各行に isEvaluated が存在しない古いキャッシュデータの互換性対応
          const sanitizedSheets = state.sheets.map((s) => ({
            ...s,
            items: s.items.map((it) => ({
              ...it,
              isEvaluated: it.isEvaluated ?? hasOperator(it.rawInput),
            })),
          }));
          const curSheet = sanitizedSheets.find((s) => s.id === state.currentSheetId);
          const curActiveId =
            curSheet && curSheet.items.length > 0
              ? curSheet.items[curSheet.items.length - 1].id
              : null;
          storeApi?.setState({
            sheets: sanitizedSheets,
            activeItemId: curActiveId,
            isSampleState: state.isSampleState ?? false,
            dismissedTooltips: state.dismissedTooltips ?? {},
          });
        }
        storeApi?.setState({ hasHydrated: true });
      },
    }
  )
);
