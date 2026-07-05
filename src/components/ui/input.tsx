"use client";

import { useState } from "react";
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

const AMOUNT_SIZES = {
  lg: "rounded-2xl px-4 py-3 text-2xl",
  sm: "rounded-xl px-3 py-2 text-base",
} as const;

/**
 * Soft-mono figure for entering an amount of money — used by every money
 * form in the app. Displays grouped digits per the currency's locale (e.g.
 * "1.500.000" for VND) while a hidden input carries the raw digit string
 * under the real field `name`, so server actions keep receiving a plain
 * number string regardless of what separator the visible field shows.
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

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => setDigits(onlyDigits(e.target.value))}
        className={`w-full border border-ink/15 bg-white font-[family-name:var(--font-mono)] tabular-nums placeholder:text-ink/30 focus:border-a/50 ${AMOUNT_SIZES[size]} ${className}`}
        {...props}
      />
      <input type="hidden" name={name} value={digits} />
    </>
  );
}
