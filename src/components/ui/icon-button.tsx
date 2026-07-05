import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-sm disabled:opacity-40";

/** Circular 36px control for prev/next arrows and similar compact icon actions. */
export function IconButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${CLASS} ${className}`} {...props} />
  );
}

/** Same visual treatment as IconButton, for prev/next controls that navigate. */
export function IconLinkButton({
  href,
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} className={`${CLASS} ${className}`} {...props} />;
}
