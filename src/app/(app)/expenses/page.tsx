import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { normalizeExpenseRow } from "@/lib/expenses";
import { ExpenseRow } from "@/components/expense-row";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; from?: string; to?: string }>;
}) {
  const { categoryId, from, to } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let expensesQuery = supabase
    .from("expenses")
    .select(
      "id, amount, note, category_id, spent_on, receipt_path, visibility, categories(id, name, icon)",
    )
    .eq("user_id", user!.id)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (categoryId) expensesQuery = expensesQuery.eq("category_id", categoryId);
  if (from) expensesQuery = expensesQuery.gte("spent_on", from);
  if (to) expensesQuery = expensesQuery.lte("spent_on", to);

  const [{ data: profile }, { data: categories }, { data: expenses }] =
    await Promise.all([
      supabase.from("profiles").select("currency").eq("id", user!.id).single(),
      supabase
        .from("categories")
        .select("id, name, icon")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: true }),
      expensesQuery,
    ]);
  const currency = profile?.currency ?? "VND";

  const items = (expenses ?? []).map((row) =>
    normalizeExpenseRow(
      row as unknown as Parameters<typeof normalizeExpenseRow>[0],
    ),
  );
  const total = items.reduce((sum, { expense }) => sum + expense.amount, 0);

  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Tất cả chi tiêu
      </h1>

      <form method="get" className="flex flex-wrap gap-2">
        <select
          name="categoryId"
          defaultValue={categoryId ?? ""}
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={from ?? ""}
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={to ?? ""}
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-a px-4 py-2 text-sm text-paper"
        >
          Lọc
        </button>
      </form>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/60">Tổng ({items.length} khoản)</p>
        <p className="font-[family-name:var(--font-mono)] text-2xl">
          {formatCurrency(total, currency)}
        </p>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        {items.length > 0 ? (
          items.map(({ expense, category }) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              category={category}
              currency={currency}
            />
          ))
        ) : (
          <p className="text-ink/40">Không có khoản chi nào.</p>
        )}
      </div>
    </div>
  );
}
