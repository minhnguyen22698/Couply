"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import {
  type ExpenseCategory,
  ExpenseSheetProvider,
  useExpenseSheet,
} from "@/components/expense-sheet-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/together", label: "Chúng ta" },
  { href: "/reports", label: "Báo cáo" },
  { href: "/settings", label: "Cài đặt" },
];

function Fab() {
  const { openCreate } = useExpenseSheet();
  return (
    <button
      type="button"
      onClick={openCreate}
      title="Thêm chi tiêu"
      className="fixed bottom-20 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-a text-2xl text-paper shadow-lg"
    >
      +
    </button>
  );
}

export function AppShell({
  children,
  categories,
  userId,
  hasPartner,
}: {
  children: React.ReactNode;
  categories: ExpenseCategory[];
  userId: string;
  hasPartner: boolean;
}) {
  const pathname = usePathname();

  return (
    <ExpenseSheetProvider>
      <div className="flex min-h-full flex-1 flex-col bg-paper text-ink">
        <main className="flex-1 pb-24">{children}</main>

        <Fab />

        <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-ink/10 bg-paper py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-xs ${
                  isActive ? "text-a font-medium" : "text-ink/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <AddExpenseSheet
          categories={categories}
          userId={userId}
          hasPartner={hasPartner}
        />
      </div>
    </ExpenseSheetProvider>
  );
}
