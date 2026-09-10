"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export type KeypadButtonVariant = "digit" | "operator" | "equals" | "function";

interface KeypadButtonProps {
  label: ReactNode;
  onClick: () => void;
  variant?: KeypadButtonVariant;
  className?: string;
  ariaLabel?: string;
}

const VARIANT_CLASS: Record<KeypadButtonVariant, string> = {
  digit: "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 active:bg-slate-200",
  operator: "bg-slate-100 text-slate-700 shadow-sm ring-1 ring-slate-200 active:bg-slate-200",
  equals: "bg-emerald-500 text-white shadow-sm active:bg-emerald-600",
  function: "bg-slate-200 text-slate-700 shadow-sm active:bg-slate-300",
};

export default function KeypadButton({
  label,
  onClick,
  variant = "digit",
  className = "",
  ariaLabel,
}: KeypadButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      onPointerUp={(e) => {
        e.currentTarget.blur();
      }}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.92, filter: "brightness(0.9)" }}
      transition={{ duration: 0.05 }}
      className={`flex h-12 items-center justify-center rounded-xl text-lg font-semibold tabular-nums select-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none touch-manipulation sm:h-14 ${VARIANT_CLASS[variant]} ${className}`}
    >
      {label}
    </motion.button>
  );
}
