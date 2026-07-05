import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { normalizeExpenseRow } from "@/lib/expenses";
import { ExpenseRow } from "@/components/expense-row";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { start, end } = currentMonthRange();

  const [{ data: profile }, { data: monthExpenses }, { data: recent }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, currency")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user!.id)
        .gte("spent_on", start)
        .lt("spent_on", end),
      supabase
        .from("expenses")
        .select(
          "id, amount, note, category_id, spent_on, receipt_path, visibility, categories(id, name, icon)",
        )
        .eq("user_id", user!.id)
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const currency = profile?.currency ?? "VND";

  const total = (monthExpenses ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  );

  const items = (recent ?? []).map((row) =>
    normalizeExpenseRow(
      row as unknown as Parameters<typeof normalizeExpenseRow>[0],
    ),
  );

  return (
    <div className="flex flex-col gap-6 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Chào, {profile?.display_name ?? "bạn"} 👋
      </h1>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/60">Tổng chi tháng này</p>
        <p className="font-[family-name:var(--font-mono)] text-3xl">
          {formatCurrency(total, currency)}
        </p>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
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
      </div>
    </div>
  );
}
