import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

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

/** Big mono figure for entering an amount of money — used by every money form in the app. */
export function AmountInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className={`w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 font-[family-name:var(--font-mono)] text-2xl placeholder:text-ink/30 focus:border-a/50 ${className}`}
      {...props}
    />
  );
}
