"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Heart,
  LayoutDashboard,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import {
  type ExpenseCategory,
  ExpenseSheetProvider,
  useExpenseSheet,
} from "@/components/expense-sheet-context";
import { RealtimeNotifications } from "@/components/realtime-notifications";
import { ToastProvider } from "@/components/toast-provider";

const LEFT_NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/together", label: "Chúng ta", icon: Heart },
];
const RIGHT_NAV_ITEMS = [
  { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

// Descendant of <Link> so useLinkStatus() reports that specific link's
// pending state — gives every bottom-nav tab the same tap feedback instead
// of some tabs feeling instant (router cache hit) and others feeling dead
// (cache miss, no boundary reacts until data arrives).
function NavPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`nav-hint absolute -right-0.5 -top-0.5 ${pending ? "is-pending" : ""}`}
    />
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
        isActive ? "font-medium text-a" : "text-ink/60"
      }`}
    >
      <span className="relative">
        <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
        <NavPendingHint />
      </span>
      {label}
    </Link>
  );
}

function CenterFab() {
  const { openCreate } = useExpenseSheet();
  return (
    <div className="flex flex-1 items-center justify-center">
      <button
        type="button"
        onClick={openCreate}
        title="Thêm chi tiêu"
        className="relative -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-a text-paper shadow-lg"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}

export function AppShell({
  children,
  categories,
  userId,
  hasPartner,
  currency,
  unreadNotifications,
}: {
  children: React.ReactNode;
  categories: ExpenseCategory[];
  userId: string;
  hasPartner: boolean;
  currency: string;
  unreadNotifications: number;
}) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <ExpenseSheetProvider>
        <div className="flex min-h-full flex-1 flex-col bg-paper text-ink">
          <main key={pathname} className="animate-page-in flex-1 pb-28">
            {children}
          </main>

          <RealtimeNotifications
            userId={userId}
            initialUnreadCount={unreadNotifications}
          />

          <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-ink/10 bg-paper">
            {LEFT_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
            <CenterFab />
            {RIGHT_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </nav>

          <AddExpenseSheet
            categories={categories}
            userId={userId}
            hasPartner={hasPartner}
            currency={currency}
          />
        </div>
      </ExpenseSheetProvider>
    </ToastProvider>
  );
}
