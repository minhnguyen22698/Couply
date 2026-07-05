import type {
  ExpenseCategory,
  ExpenseRecord,
} from "@/components/expense-sheet-context";

type RawExpenseRow = {
  id: string;
  amount: number | string;
  note: string | null;
  category_id: string | null;
  spent_on: string;
  receipt_path: string | null;
  visibility: ExpenseRecord["visibility"];
  categories: ExpenseCategory | null;
};

export function normalizeExpenseRow(row: RawExpenseRow): {
  expense: ExpenseRecord;
  category: ExpenseCategory | null;
} {
  return {
    expense: {
      id: row.id,
      amount: Number(row.amount),
      note: row.note,
      category_id: row.category_id,
      spent_on: row.spent_on,
      receipt_path: row.receipt_path,
      visibility: row.visibility,
    },
    category: row.categories,
  };
}
