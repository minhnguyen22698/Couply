import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { updateCurrency } from "./actions";

const CURRENCY_OPTIONS = [
  { value: "VND", label: "VND — Đồng Việt Nam" },
  { value: "USD", label: "USD — US Dollar" },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: couple }] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user!.id).single(),
    supabase
      .from("couples")
      .select("status")
      .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const partnerStatusLabel =
    couple?.status === "active"
      ? "Đã kết nối"
      : couple?.status === "pending"
        ? "Đang chờ partner nhập mã"
        : "Chưa kết nối";

  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Cài đặt
      </h1>

      <div className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white p-4">
        <p className="text-sm text-ink/60">Tiền tệ</p>
        <form action={updateCurrency} className="flex gap-2">
          <select
            name="currency"
            defaultValue={profile?.currency ?? "VND"}
            className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-a px-4 py-2 text-sm text-paper"
          >
            Lưu
          </button>
        </form>
      </div>

      <Link
        href="/together"
        className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-4 text-sm"
      >
        <span>Kết nối partner</span>
        <span className="text-ink/60">{partnerStatusLabel}</span>
      </Link>

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
      <a
        href="/settings/export"
        className="w-fit rounded-xl border border-ink/15 px-4 py-2 text-sm"
      >
        Xuất CSV chi tiêu
      </a>
      <LogoutButton />
    </div>
  );
}
