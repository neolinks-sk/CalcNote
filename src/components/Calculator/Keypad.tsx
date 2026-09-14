"use client";

import { useEffect } from "react";
import { Calculator, ChevronUp, Delete } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalcStore } from "@/store/useCalcStore";
import KeypadButton from "./KeypadButton";

export default function Keypad() {
  const isKeypadVisible = useCalcStore((s) => s.isKeypadVisible);
  const toggleKeypad = useCalcStore((s) => s.toggleKeypad);
  const errorMessage = useCalcStore((s) => s.errorMessage);
  const isSampleState = useCalcStore((s) => s.isSampleState);
  const pressDigit = useCalcStore((s) => s.pressDigit);
  const pressOperator = useCalcStore((s) => s.pressOperator);
  const pressEquals = useCalcStore((s) => s.pressEquals);
  const pressClear = useCalcStore((s) => s.pressClear);
  const openAllClearModal = useCalcStore((s) => s.openAllClearModal);
  const pressBackspace = useCalcStore((s) => s.pressBackspace);
  const clearErrorMessage = useCalcStore((s) => s.clearErrorMessage);

  useEffect(() => {
    if (!errorMessage) return;
    const t = window.setTimeout(() => clearErrorMessage(), 3200);
    return () => window.clearTimeout(t);
  }, [errorMessage, clearErrorMessage]);

  if (!isKeypadVisible) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          toggleKeypad();
        }}
        role="button"
        tabIndex={0}
        aria-label="テンキーを表示する"
        title="テンキーを表示する"
        className="shrink-0 border-t border-slate-200 bg-slate-50/90 hover:bg-slate-100 px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 transition cursor-pointer select-none active:scale-[0.99]"
      >
        <Calculator size={14} className="text-slate-500" />
        <span>テンキーを表示する</span>
        <ChevronUp size={14} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative shrink-0 border-t border-slate-200 bg-slate-50 px-3 pb-3 pt-2 select-none"
    >
      {errorMessage && (
        <div
          role="alert"
          className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-semibold text-red-600 ring-1 ring-red-200"
        >
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {/* AC ボタン ＆ 初回サンプル用ツールチップ吹き出し（点滅なし・圧倒的存在感の最大ビッグサイズ・AC全削除まで維持） */}
        <div className="relative">
          <AnimatePresence>
            {isSampleState && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute -top-14 sm:-top-16 left-0 z-50 flex items-center whitespace-nowrap rounded-2xl bg-slate-900 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-black tracking-wide text-white shadow-2xl ring-2 ring-white/30 select-none"
              >
                <span>[AC] を押して全消去＆スタート</span>
                <div className="absolute -bottom-1.5 left-7 h-3.5 w-3.5 rotate-45 bg-slate-900" />
              </motion.div>
            )}
          </AnimatePresence>

          <KeypadButton
            label="AC"
            variant="function"
            onClick={openAllClearModal}
            ariaLabel="オールクリア（すべての計算を削除）"
            className={`w-full ${
              isSampleState
                ? "animate-pulse bg-red-100 font-bold text-red-700 ring-2 ring-red-500 shadow-md"
                : ""
            }`}
          />
        </div>

        <KeypadButton label="C" variant="function" onClick={pressClear} ariaLabel="クリア" />
        <KeypadButton
          label={<Delete size={20} />}
          variant="function"
          onClick={pressBackspace}
          ariaLabel="1文字削除"
        />
        <KeypadButton
          label="÷"
          variant="operator"
          onClick={() => pressOperator("÷")}
          ariaLabel="割る"
        />

        {(["7", "8", "9"] as const).map((d) => (
          <KeypadButton key={d} label={d} onClick={() => pressDigit(d)} />
        ))}
        <KeypadButton label="×" variant="operator" onClick={() => pressOperator("×")} ariaLabel="掛ける" />

        {(["4", "5", "6"] as const).map((d) => (
          <KeypadButton key={d} label={d} onClick={() => pressDigit(d)} />
        ))}
        <KeypadButton label="−" variant="operator" onClick={() => pressOperator("-")} ariaLabel="引く" />

        {(["1", "2", "3"] as const).map((d) => (
          <KeypadButton key={d} label={d} onClick={() => pressDigit(d)} />
        ))}
        <KeypadButton label="＋" variant="operator" onClick={() => pressOperator("+")} ariaLabel="足す" />

        <KeypadButton label="0" onClick={() => pressDigit("0")} className="col-span-2" />
        <KeypadButton label="." onClick={() => pressDigit(".")} ariaLabel="小数点" />
        <KeypadButton label="=" variant="equals" onClick={pressEquals} ariaLabel="計算結果を表示" />
      </div>
    </div>
  );
}
