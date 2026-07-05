import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { PeriodSelector } from "@/components/period-selector";
import { getPeriodRange, parseAnchor, parsePeriod, toIso } from "@/lib/period";
import { CategoryBarChart, type CategoryDatum } from "@/components/category-bar-chart";
import {
  CoupleComparisonChart,
  type ComparisonDatum,
} from "@/components/couple-comparison-chart";

type CategoryTotal = {
  categoryId: string | null;
  name: string;
  icon: string;
  total: number;
};

function monthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

function monthLabel(d: Date) {
  return `Th${d.getMonth() + 1}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const { period: rawPeriod, date: rawDate } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const anchor = parseAnchor(rawDate);
  const { start, end } = getPeriodRange(period, anchor);

  const { start: thisMonthStart, end: thisMonthEnd } = monthRange(0);
  const { start: lastMonthStart, end: lastMonthEnd } = monthRange(1);
  const { start: sixMonthsStart } = monthRange(5);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: expenses },
    { data: thisMonthExpenses },
    { data: lastMonthExpenses },
    { data: couple },
  ] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user!.id).single(),
    supabase
      .from("expenses")
      .select("amount, category_id, categories(name, icon)")
      .eq("user_id", user!.id)
      .gte("spent_on", toIso(start))
      .lt("spent_on", toIso(end)),
    supabase
      .from("expenses")
      .select("amount, category_id, categories(name, icon)")
      .eq("user_id", user!.id)
      .gte("spent_on", toIso(thisMonthStart))
      .lt("spent_on", toIso(thisMonthEnd)),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user!.id)
      .gte("spent_on", toIso(lastMonthStart))
      .lt("spent_on", toIso(lastMonthEnd)),
    supabase
      .from("couples")
      .select("id, user_a_id, user_b_id, status")
      .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  const currency = profile?.currency ?? "VND";

  // Category breakdown for the selected period.
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
  const chartData: CategoryDatum[] = breakdown.map((c) => ({
    name: c.name,
    icon: c.icon,
    total: c.total,
  }));

  // End-of-month summary, always the current calendar month.
  const thisMonthTotal = (thisMonthExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const lastMonthTotal = (lastMonthExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const monthDeltaPercent =
    lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : null;

  const thisMonthByCategory = new Map<string, CategoryTotal>();
  for (const row of thisMonthExpenses ?? []) {
    const category = row.categories as unknown as {
      name: string;
      icon: string;
    } | null;
    const key = row.category_id ?? "none";
    const existing = thisMonthByCategory.get(key);
    const amount = Number(row.amount);
    if (existing) {
      existing.total += amount;
    } else {
      thisMonthByCategory.set(key, {
        categoryId: row.category_id,
        name: category?.name ?? "Khác",
        icon: category?.icon ?? "📦",
        total: amount,
      });
    }
  }
  const topCategory = Array.from(thisMonthByCategory.values()).sort(
    (a, b) => b.total - a.total,
  )[0];

  // Couple comparison over the last 6 months.
  let comparisonData: ComparisonDatum[] | null = null;
  let partnerName = "Partner";
  if (couple) {
    const partnerId =
      couple.user_a_id === user!.id ? couple.user_b_id : couple.user_a_id;

    const [{ data: partnerProfile }, { data: sharedExpenses }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", partnerId!)
          .single(),
        supabase
          .from("expenses")
          .select("user_id, amount, spent_on")
          .eq("couple_id", couple.id)
          .neq("visibility", "private")
          .gte("spent_on", toIso(sixMonthsStart))
          .lt("spent_on", toIso(thisMonthEnd)),
      ]);
    partnerName = partnerProfile?.display_name ?? "Partner";

    const buckets = new Map<string, ComparisonDatum>();
    for (let i = 5; i >= 0; i--) {
      const { start: bStart } = monthRange(i);
      buckets.set(monthKey(bStart), {
        month: monthLabel(bStart),
        mine: 0,
        partner: 0,
      });
    }
    for (const row of sharedExpenses ?? []) {
      const d = new Date(`${row.spent_on}T00:00:00`);
      const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (row.user_id === user!.id) bucket.mine += Number(row.amount);
      else bucket.partner += Number(row.amount);
    }
    comparisonData = Array.from(buckets.values());
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Báo cáo
      </h1>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/60">Tóm tắt tháng này</p>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-2xl">
          {formatCurrency(thisMonthTotal, currency)}
        </p>
        <p className="mt-1 text-sm text-ink/60">
          {monthDeltaPercent === null
            ? "Chưa có dữ liệu tháng trước để so sánh."
            : monthDeltaPercent >= 0
              ? `Tăng ${monthDeltaPercent}% so với tháng trước`
              : `Giảm ${Math.abs(monthDeltaPercent)}% so với tháng trước`}
        </p>
        {topCategory && (
          <p className="mt-1 text-sm text-ink/60">
            Chi nhiều nhất: {topCategory.icon} {topCategory.name} (
            {formatCurrency(topCategory.total, currency)})
          </p>
        )}
      </div>

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
          <>
            <CategoryBarChart data={chartData} currency={currency} />
            <div className="mt-4 flex flex-col gap-2">
              {breakdown.map((c) => {
                const percent =
                  total > 0 ? Math.round((c.total / total) * 100) : 0;
                return (
                  <div
                    key={c.categoryId ?? "none"}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {c.icon} {c.name} · {percent}%
                    </span>
                    <span className="font-[family-name:var(--font-mono)]">
                      {formatCurrency(c.total, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-ink/40">Chưa có khoản chi nào trong khoảng này.</p>
        )}
      </div>

      {comparisonData && (
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="mb-2 text-sm text-ink/60">
            So sánh chi tiêu chung — 6 tháng gần đây
          </p>
          <CoupleComparisonChart
            data={comparisonData}
            partnerName={partnerName}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
}
