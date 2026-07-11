import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline" | "danger-outline";
export type ButtonSize = "lg" | "md" | "sm";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 shrink-0 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const SIZES: Record<ButtonSize, string> = {
  lg: "rounded-2xl px-5 py-3 text-base",
  md: "rounded-xl px-4 py-2.5 text-sm",
  sm: "rounded-xl px-3 py-1.5 text-xs",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-a text-paper",
  outline: "border border-ink/15 text-ink",
  "danger-outline": "border border-danger/30 text-danger",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
) {
  return [
    "inline-flex items-center justify-center gap-2 font-medium transition-opacity disabled:opacity-60 disabled:pointer-events-none",
    SIZES[size],
    VARIANTS[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      className={buttonClassName(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
