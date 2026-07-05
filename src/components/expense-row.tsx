"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteExpense } from "@/app/(app)/expenses/actions";
import {
  type ExpenseCategory,
  type ExpenseRecord,
  useExpenseSheet,
} from "@/components/expense-sheet-context";
import { formatCurrency } from "@/lib/format";

export function ExpenseRow({
  expense,
  category,
  currency,
}: {
  expense: ExpenseRecord;
  category: ExpenseCategory | null;
  currency: string;
}) {
  const { openEdit } = useExpenseSheet();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteExpense(expense.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink/10 py-3 last:border-0">
      <button
        type="button"
        onClick={() => openEdit(expense)}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <span className="text-xl">{category?.icon ?? "📦"}</span>
        <span className="flex flex-col">
          <span className="text-sm">{category?.name ?? "Khác"}</span>
          {expense.note && (
            <span className="text-xs text-ink/50">{expense.note}</span>
          )}
        </span>
      </button>
      <span className="font-[family-name:var(--font-mono)] tabular-nums">
        {formatCurrency(expense.amount, currency)}
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm text-danger/70 disabled:opacity-40"
      >
        Xoá
      </button>
    </div>
  );
}
