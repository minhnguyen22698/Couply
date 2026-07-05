"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/app/(app)/expenses/actions";
import {
  type ExpenseCategory,
  type ExpenseRecord,
  useExpenseSheet,
} from "@/components/expense-sheet-context";
import { PhotoCapture } from "@/components/photo-capture";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Riêng tư" },
  { value: "shared", label: "Chia sẻ" },
  { value: "fund", label: "Quỹ chung" },
] as const;

function ExpenseForm({
  categories,
  userId,
  hasPartner,
  editingExpense,
  isPending,
  error,
  onSubmit,
  onDelete,
}: {
  categories: ExpenseCategory[];
  userId: string;
  hasPartner: boolean;
  editingExpense: ExpenseRecord | null;
  isPending: boolean;
  error: string | null;
  onSubmit: (formData: FormData) => void;
  onDelete: () => void;
}) {
  const [receiptPath, setReceiptPath] = useState<string | null>(
    editingExpense?.receipt_path ?? null,
  );

  return (
    <form
      action={onSubmit}
      className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-paper p-6 pb-8"
    >
      <div className="mx-auto h-1 w-10 rounded-full bg-ink/15" />

      <h2 className="font-[family-name:var(--font-display)] text-xl">
        {editingExpense ? "Sửa khoản chi" : "Thêm chi tiêu"}
      </h2>

      <input
        name="amount"
        type="text"
        inputMode="decimal"
        placeholder="0"
        required
        defaultValue={editingExpense?.amount ?? ""}
        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 font-[family-name:var(--font-mono)] text-2xl"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <label key={category.id} className="shrink-0">
            <input
              type="radio"
              name="categoryId"
              value={category.id}
              defaultChecked={
                editingExpense
                  ? editingExpense.category_id === category.id
                  : category === categories[0]
              }
              className="peer sr-only"
            />
            <span className="flex cursor-pointer items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-sm peer-checked:border-a peer-checked:bg-a peer-checked:text-paper">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </span>
          </label>
        ))}
      </div>

      <input
        name="note"
        type="text"
        placeholder="Ghi chú (tuỳ chọn)"
        defaultValue={editingExpense?.note ?? ""}
        className="rounded-2xl border border-ink/15 bg-white px-4 py-2"
      />

      <input
        name="spentOn"
        type="date"
        defaultValue={editingExpense?.spent_on ?? todayIso()}
        className="rounded-2xl border border-ink/15 bg-white px-4 py-2"
      />

      {hasPartner && (
        <div className="flex gap-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <label key={option.value} className="flex-1">
              <input
                type="radio"
                name="visibility"
                value={option.value}
                defaultChecked={
                  (editingExpense?.visibility ?? "private") === option.value
                }
                className="peer sr-only"
              />
              <span className="flex cursor-pointer items-center justify-center rounded-xl border border-ink/15 px-3 py-2 text-sm peer-checked:border-a peer-checked:bg-a peer-checked:text-paper">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-sm text-ink/60">Ảnh hoá đơn</p>
        <input type="hidden" name="receiptPath" value={receiptPath ?? ""} />
        <PhotoCapture
          userId={userId}
          value={receiptPath}
          onChange={setReceiptPath}
        />
      </div>

      {error && <p className="text-sm text-a">{error}</p>}

      <div className="flex gap-3">
        {editingExpense && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="rounded-2xl border border-ink/15 px-5 py-3 text-sm"
          >
            Xoá
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-2xl bg-a px-5 py-3 font-medium text-paper disabled:opacity-60"
        >
          {isPending ? "Đang lưu…" : "Lưu"}
        </button>
      </div>
    </form>
  );
}

export function AddExpenseSheet({
  categories,
  userId,
  hasPartner,
}: {
  categories: ExpenseCategory[];
  userId: string;
  hasPartner: boolean;
}) {
  const { state, close } = useExpenseSheet();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (state.mode === "closed") return null;

  const editingExpense = state.mode === "edit" ? state.expense : null;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = editingExpense
        ? await updateExpense(editingExpense.id, undefined, formData)
        : await createExpense(undefined, formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      close();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!editingExpense) return;
    startTransition(async () => {
      await deleteExpense(editingExpense.id);
      close();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40">
      <button
        type="button"
        aria-label="Đóng"
        onClick={close}
        className="absolute inset-0"
      />

      <ExpenseForm
        key={editingExpense?.id ?? "create"}
        categories={categories}
        userId={userId}
        hasPartner={hasPartner}
        editingExpense={editingExpense}
        isPending={isPending}
        error={error}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
