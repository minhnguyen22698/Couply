import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { PeriodSelector } from "@/components/period-selector";
import { getPeriodRange, parseAnchor, parsePeriod, toIso } from "@/lib/period";

type CategoryTotal = {
  categoryId: string | null;
  name: string;
  icon: string;
  total: number;
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const { period: rawPeriod, date: rawDate } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const anchor = parseAnchor(rawDate);
  const { start, end } = getPeriodRange(period, anchor);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: expenses }] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user!.id).single(),
    supabase
      .from("expenses")
      .select("amount, category_id, categories(name, icon)")
      .eq("user_id", user!.id)
      .gte("spent_on", toIso(start))
      .lt("spent_on", toIso(end)),
  ]);
  const currency = profile?.currency ?? "VND";

  const totalsByCategory = new Map<string, CategoryTotal>();
  for (const row of expenses ?? []) {
    const category = row.categories as unknown as {
      name: string;
      icon: string;
    } | null;
    const key = row.category_id ?? "none";
    const existing = totalsByCategory.get(key);
    const amount = Number(row.amount);
    if (existing) {
      existing.total += amount;
    } else {
      totalsByCategory.set(key, {
        categoryId: row.category_id,
        name: category?.name ?? "Khác",
        icon: category?.icon ?? "📦",
        total: amount,
      });
    }
  }

  const breakdown = Array.from(totalsByCategory.values()).sort(
    (a, b) => b.total - a.total,
  );
  const total = breakdown.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="flex flex-col gap-6 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Báo cáo
      </h1>

      <PeriodSelector basePath="/reports" period={period} anchor={anchor} />

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/60">Tổng chi</p>
        <p className="font-[family-name:var(--font-mono)] text-3xl">
          {formatCurrency(total, currency)}
        </p>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <p className="mb-2 text-sm text-ink/60">Theo danh mục</p>
        {breakdown.length > 0 ? (
          <div className="flex flex-col gap-3">
            {breakdown.map((c) => {
              const percent = total > 0 ? Math.round((c.total / total) * 100) : 0;
              return (
                <div key={c.categoryId ?? "none"} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {c.icon} {c.name}
                    </span>
                    <span className="font-[family-name:var(--font-mono)]">
                      {formatCurrency(c.total, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full bg-a"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-ink/40">Chưa có khoản chi nào trong khoảng này.</p>
        )}
      </div>
    </div>
  );
}
