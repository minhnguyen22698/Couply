export type Period = "day" | "month" | "year";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getPeriodRange(period: Period, anchor: Date) {
  if (period === "day") {
    const start = startOfDay(anchor);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (period === "year") {
    const start = new Date(anchor.getFullYear(), 0, 1);
    const end = new Date(anchor.getFullYear() + 1, 0, 1);
    return { start, end };
  }

  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  return { start, end };
}

export function shiftAnchor(period: Period, anchor: Date, direction: 1 | -1) {
  const next = new Date(anchor);
  if (period === "day") next.setDate(next.getDate() + direction);
  else if (period === "year") next.setFullYear(next.getFullYear() + direction);
  else next.setMonth(next.getMonth() + direction);
  return next;
}

export function formatPeriodLabel(period: Period, anchor: Date) {
  if (period === "day") return anchor.toLocaleDateString("vi-VN");
  if (period === "year") return `${anchor.getFullYear()}`;
  return `Tháng ${anchor.getMonth() + 1}/${anchor.getFullYear()}`;
}

export function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function parsePeriod(raw: string | undefined): Period {
  return raw === "day" || raw === "year" ? raw : "month";
}

export function parseAnchor(raw: string | undefined): Date {
  if (raw) {
    const parsed = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return startOfDay(new Date());
}
