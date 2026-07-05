"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import {
  type ExpenseCategory,
  ExpenseSheetProvider,
  useExpenseSheet,
} from "@/components/expense-sheet-context";
import { RealtimeNotifications } from "@/components/realtime-notifications";

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
      className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-a text-2xl text-paper shadow-lg"
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
  unreadNotifications,
}: {
  children: React.ReactNode;
  categories: ExpenseCategory[];
  userId: string;
  hasPartner: boolean;
  unreadNotifications: number;
}) {
  const pathname = usePathname();

  return (
    <ExpenseSheetProvider>
      <div className="flex min-h-full flex-1 flex-col bg-paper text-ink">
        <main className="flex-1 pb-28">{children}</main>

        <RealtimeNotifications
          userId={userId}
          initialUnreadCount={unreadNotifications}
        />

        <Fab />

        <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 flex border-t border-ink/10 bg-paper">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
                  isActive ? "font-medium text-a" : "text-ink/60"
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
