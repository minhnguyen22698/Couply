import Link from "next/link";
import type { ReactNode } from "react";

/** A full-width tappable settings-style row — label left, value + chevron right. */
export function ListRow({
  href,
  label,
  value,
  external,
}: {
  href: string;
  label: ReactNode;
  value?: ReactNode;
  external?: boolean;
}) {
  const className =
    "flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm";
  const content = (
    <>
      <span>{label}</span>
      <span className="flex items-center gap-1 text-ink/60">
        {value}
        <span aria-hidden className="text-ink/30">
          ›
        </span>
      </span>
    </>
  );

  if (external) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
