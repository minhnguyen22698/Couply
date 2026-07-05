import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { normalizeExpenseRow } from "@/lib/expenses";
import { ExpenseRow } from "@/components/expense-row";
import { PeriodSelector } from "@/components/period-selector";
import { getPeriodRange, parseAnchor, parsePeriod, toIso } from "@/lib/period";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

function currentMonthIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const { period: rawPeriod, date: rawDate } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const anchor = parseAnchor(rawDate);
  const { start, end } = getPeriodRange(period, anchor);
  const { start: monthStart, end: monthEnd } = getPeriodRange(
    "month",
    parseAnchor(undefined),
  );
  const budgetMonth = currentMonthIso();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: periodExpenses },
    { data: recent },
    { data: categories },
    { data: budgets },
    { data: monthCategoryExpenses },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, currency")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user!.id)
      .gte("spent_on", toIso(start))
      .lt("spent_on", toIso(end)),
    supabase
      .from("expenses")
      .select(
        "id, amount, note, category_id, spent_on, receipt_path, visibility, categories(id, name, icon)",
      )
      .eq("user_id", user!.id)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("categories").select("id, name, icon").eq("user_id", user!.id),
    supabase
      .from("budgets")
      .select("category_id, amount")
      .eq("user_id", user!.id)
      .eq("month", budgetMonth),
    supabase
      .from("expenses")
      .select("amount, category_id")
      .eq("user_id", user!.id)
      .gte("spent_on", toIso(monthStart))
      .lt("spent_on", toIso(monthEnd)),
  ]);

  const currency = profile?.currency ?? "VND";

  const total = (periodExpenses ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  );

  const spentByCategory = new Map<string, number>();
  for (const e of monthCategoryExpenses ?? []) {
    if (!e.category_id) continue;
    spentByCategory.set(
      e.category_id,
      (spentByCategory.get(e.category_id) ?? 0) + Number(e.amount),
    );
  }

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  const budgetWarnings = (budgets ?? [])
    .map((b) => {
      const spent = spentByCategory.get(b.category_id) ?? 0;
      const amount = Number(b.amount);
      const percent = amount > 0 ? Math.round((spent / amount) * 100) : 0;
      const category = categoryById.get(b.category_id);
      return {
        categoryId: b.category_id,
        name: category?.name ?? "Danh mục",
        icon: category?.icon ?? "📦",
        percent,
      };
    })
    .filter((w) => w.percent >= 80);

  const items = (recent ?? []).map((row) =>
    normalizeExpenseRow(
      row as unknown as Parameters<typeof normalizeExpenseRow>[0],
    ),
  );

  return (
    <div className="flex flex-col gap-6 px-5 pt-10">
      <PageHeader title={`Chào, ${profile?.display_name ?? "bạn"} 👋`} />

      {budgetWarnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {budgetWarnings.map((w) => {
            const isOver = w.percent >= 100;
            return (
              <div
                key={w.categoryId}
                className={`rounded-2xl border p-4 text-sm ${
                  isOver
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-gold/40 bg-gold/10 text-ink"
                }`}
              >
                {w.icon} {w.name}:{" "}
                {isOver
                  ? `đã vượt ngân sách tháng này (${w.percent}%)`
                  : `sắp đạt ngân sách tháng này (${w.percent}%)`}
              </div>
            );
          })}
        </div>
      )}

      <PeriodSelector basePath="/dashboard" period={period} anchor={anchor} />

      <Card>
        <p className="text-sm text-ink/60">Tổng chi</p>
        <p className="font-[family-name:var(--font-mono)] tabular-nums text-3xl">
          {formatCurrency(total, currency)}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink/60">Gần đây</p>
          <Link href="/expenses" className="text-sm text-a">
            Xem tất cả
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="mt-2">
            {items.map(({ expense, category }) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                category={category}
                currency={currency}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-ink/40">Chưa có khoản chi nào.</p>
        )}
      </Card>
    </div>
  );
}
