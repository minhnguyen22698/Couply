import Link from "next/link";
import { formatPeriodLabel, shiftAnchor, toIso, type Period } from "@/lib/period";
import { IconLinkButton } from "@/components/ui/icon-button";

const TABS: { value: Period; label: string }[] = [
  { value: "day", label: "Ngày" },
  { value: "month", label: "Tháng" },
  { value: "year", label: "Năm" },
];

export function PeriodSelector({
  basePath,
  period,
  anchor,
}: {
  basePath: string;
  period: Period;
  anchor: Date;
}) {
  const prev = shiftAnchor(period, anchor, -1);
  const next = shiftAnchor(period, anchor, 1);

  function hrefFor(p: Period, a: Date) {
    return `${basePath}?period=${p}&date=${toIso(a)}`;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={hrefFor(tab.value, anchor)}
            className={`flex-1 rounded-xl border border-ink/15 px-3 py-2.5 text-center text-sm ${
              tab.value === period ? "border-a bg-a text-paper" : ""
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <IconLinkButton href={hrefFor(period, prev)}>←</IconLinkButton>
        <p className="font-medium">{formatPeriodLabel(period, anchor)}</p>
        <IconLinkButton href={hrefFor(period, next)}>→</IconLinkButton>
      </div>
    </div>
  );
}
