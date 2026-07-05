import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { normalizeExpenseRow } from "@/lib/expenses";
import { ExpenseRow } from "@/components/expense-row";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

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
      <PageHeader title="Tất cả chi tiêu" />

      <form method="get" className="flex flex-wrap gap-2">
        <Select
          name="categoryId"
          defaultValue={categoryId ?? ""}
          className="w-auto flex-1 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          name="from"
          defaultValue={from ?? ""}
          className="w-auto text-sm"
        />
        <Input
          type="date"
          name="to"
          defaultValue={to ?? ""}
          className="w-auto text-sm"
        />
        <Button type="submit">Lọc</Button>
      </form>

      <Card>
        <p className="text-sm text-ink/60">Tổng ({items.length} khoản)</p>
        <p className="font-[family-name:var(--font-mono)] tabular-nums text-2xl">
          {formatCurrency(total, currency)}
        </p>
      </Card>

      <Card>
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
      </Card>
    </div>
  );
}
