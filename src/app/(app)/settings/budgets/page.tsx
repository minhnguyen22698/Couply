import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { setBudget } from "./actions";

function monthRange(monthIso: string) {
  const [y, m] = monthIso.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

function shiftMonth(monthIso: string, direction: 1 | -1) {
  const [y, m] = monthIso.split("-").map(Number);
  const d = new Date(y, m - 1 + direction, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(rawMonth ?? "")
    ? rawMonth!
    : currentMonthIso();
  const monthDate = `${month}-01`;
  const { start, end } = monthRange(month);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: categories }, { data: budgets }, { data: expenses }] =
    await Promise.all([
      supabase.from("profiles").select("currency").eq("id", user!.id).single(),
      supabase
        .from("categories")
        .select("id, name, icon")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("budgets")
        .select("category_id, amount")
        .eq("user_id", user!.id)
        .eq("month", monthDate),
      supabase
        .from("expenses")
        .select("amount, category_id")
        .eq("user_id", user!.id)
        .gte("spent_on", start)
        .lt("spent_on", end),
    ]);
  const currency = profile?.currency ?? "VND";

  const budgetByCategory = new Map(
    (budgets ?? []).map((b) => [b.category_id, Number(b.amount)]),
  );
  const spentByCategory = new Map<string, number>();
  for (const e of expenses ?? []) {
    if (!e.category_id) continue;
    spentByCategory.set(
      e.category_id,
      (spentByCategory.get(e.category_id) ?? 0) + Number(e.amount),
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <Link href="/settings" className="text-sm text-ink/60">
        ← Cài đặt
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Ngân sách
      </h1>

      <div className="flex items-center justify-between">
        <Link
          href={`/settings/budgets?month=${shiftMonth(month, -1)}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-sm"
        >
          ←
        </Link>
        <p className="font-medium">
          Tháng {Number(month.split("-")[1])}/{month.split("-")[0]}
        </p>
        <Link
          href={`/settings/budgets?month=${shiftMonth(month, 1)}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-sm"
        >
          →
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {(categories ?? []).map((category) => {
          const budget = budgetByCategory.get(category.id) ?? null;
          const spent = spentByCategory.get(category.id) ?? 0;
          const percent = budget ? Math.round((spent / budget) * 100) : null;
          const barColor =
            percent === null
              ? "bg-ink/20"
              : percent >= 100
                ? "bg-a"
                : percent >= 80
                  ? "bg-gold"
                  : "bg-b";

          return (
            <div
              key={category.id}
              className="rounded-2xl border border-ink/10 bg-white p-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span>
                  {category.icon} {category.name}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-ink/60">
                  {formatCurrency(spent, currency)}
                  {budget ? ` / ${formatCurrency(budget, currency)}` : ""}
                </span>
              </div>

              {percent !== null && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              )}
              {percent !== null && percent >= 80 && (
                <p className="mt-1 text-xs text-a">
                  {percent >= 100
                    ? "Đã vượt ngân sách!"
                    : "Sắp đạt ngân sách (80%+)"}
                </p>
              )}

              <form
                action={setBudget.bind(null, category.id, monthDate)}
                className="mt-2 flex gap-2"
              >
                <input
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Đặt ngân sách"
                  defaultValue={budget ?? ""}
                  className="flex-1 rounded-xl border border-ink/15 px-3 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-a px-3 py-1.5 text-sm text-paper"
                >
                  Lưu
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
