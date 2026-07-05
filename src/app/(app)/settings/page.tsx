"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Cài đặt
      </h1>
      <Link
        href="/settings/categories"
        className="w-fit rounded-xl border border-ink/15 px-4 py-2 text-sm"
      >
        Quản lý danh mục
      </Link>
      <Link
        href="/settings/budgets"
        className="w-fit rounded-xl border border-ink/15 px-4 py-2 text-sm"
      >
        Ngân sách
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="w-fit rounded-xl border border-ink/15 px-4 py-2 text-sm"
      >
        Đăng xuất
      </button>
    </div>
  );
}
