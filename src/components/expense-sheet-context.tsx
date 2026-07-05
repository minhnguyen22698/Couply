"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type ExpenseCategory = { id: string; name: string; icon: string };

export type ExpenseVisibility = "private" | "shared" | "fund";

export type ExpenseRecord = {
  id: string;
  amount: number;
  note: string | null;
  category_id: string | null;
  spent_on: string;
  receipt_path: string | null;
  visibility: ExpenseVisibility;
};

type SheetState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; expense: ExpenseRecord };

type ExpenseSheetContextValue = {
  state: SheetState;
  openCreate: () => void;
  openEdit: (expense: ExpenseRecord) => void;
  close: () => void;
};

const ExpenseSheetContext = createContext<ExpenseSheetContextValue | null>(
  null,
);

export function ExpenseSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<SheetState>({ mode: "closed" });

  const openCreate = useCallback(() => setState({ mode: "create" }), []);
  const openEdit = useCallback(
    (expense: ExpenseRecord) => setState({ mode: "edit", expense }),
    [],
  );
  const close = useCallback(() => setState({ mode: "closed" }), []);

  return (
    <ExpenseSheetContext.Provider
      value={{ state, openCreate, openEdit, close }}
    >
      {children}
    </ExpenseSheetContext.Provider>
  );
}

export function useExpenseSheet() {
  const ctx = useContext(ExpenseSheetContext);
  if (!ctx) {
    throw new Error("useExpenseSheet must be used within ExpenseSheetProvider");
  }
  return ctx;
}
