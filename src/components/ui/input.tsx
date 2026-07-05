"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { LOCALE_BY_CURRENCY } from "@/lib/format";

const FIELD_CLASS =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-ink placeholder:text-ink/40 focus:border-a/50";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_CLASS} ${className}`} {...props} />;
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD_CLASS} ${className}`} {...props} />;
}

function onlyDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function isDigit(ch: string) {
  return ch >= "0" && ch <= "9";
}

/** How many digit characters appear before `caret` in `text`. */
function countDigitsBefore(text: string, caret: number) {
  let count = 0;
  for (let i = 0; i < caret && i < text.length; i++) {
    if (isDigit(text[i])) count++;
  }
  return count;
}

/** The caret position in `text` that sits right after its Nth digit. */
function caretForDigitCount(text: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (isDigit(text[i])) {
      count++;
      if (count === digitCount) return i + 1;
    }
  }
  return text.length;
}

const AMOUNT_SIZES = {
  lg: "rounded-2xl px-4 py-3 text-2xl",
  sm: "rounded-xl px-3 py-2 text-base",
} as const;

/**
 * Soft-mono figure for entering an amount of money — used by every money
 * form in the app. Always displays the locale-grouped digits (e.g.
 * "1.500.000" for VND), live, while a hidden input carries the raw digit
 * string under the real field `name`.
 *
 * Reformatting on every keystroke changes the string's length (e.g. "4000"
 * -> "4.000"), which moves the browser's default caret placement to the end
 * of the field on every render. Left alone, that fights Vietnamese IME tools
 * like Unikey/EVKey — their keyboard hook reports `key: "Process"`, and a
 * caret that jumps out from under an in-progress composition can make the
 * IME replay a character (reported 2026-07-05: "4000" + one more "0" became
 * "440000"). Fix: after every reformat, explicitly restore the caret to
 * "right after the same digit it followed before" (countDigitsBefore /
 * caretForDigitCount below) so the field's on-screen state always matches
 * what the IME/browser expects, instead of relying on the browser's default
 * (jump-to-end) placement.
 */
export function AmountInput({
  name,
  currency = "VND",
  size = "lg",
  defaultValue,
  className = "",
  ...props
}: Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type" | "onChange" | "size"
> & {
  name: string;
  currency?: string;
  size?: keyof typeof AMOUNT_SIZES;
}) {
  const locale = LOCALE_BY_CURRENCY[currency] ?? "en-US";
  const [digits, setDigits] = useState(() =>
    onlyDigits(String(defaultValue ?? "")),
  );
  const display = digits ? Number(digits).toLocaleString(locale) : "";

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretDigits = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCaretDigits.current === null || !inputRef.current) return;
    const pos = caretForDigitCount(display, pendingCaretDigits.current);
    inputRef.current.setSelectionRange(pos, pos);
    pendingCaretDigits.current = null;
  }, [display]);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={(e) => {
          const raw = e.target.value;
          const caret = e.target.selectionStart ?? raw.length;
          pendingCaretDigits.current = countDigitsBefore(raw, caret);
          setDigits(onlyDigits(raw));
        }}
        className={`w-full border border-ink/15 bg-white font-[family-name:var(--font-mono)] tabular-nums placeholder:text-ink/30 focus:border-a/50 ${AMOUNT_SIZES[size]} ${className}`}
        {...props}
      />
      <input type="hidden" name={name} value={digits} />
    </>
  );
}
