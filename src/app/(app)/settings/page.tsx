import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
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
      <PageHeader title="Cài đặt" />

      <Card className="flex flex-col gap-2">
        <p className="text-sm text-ink/60">Tiền tệ</p>
        <form action={updateCurrency} className="flex gap-2">
          <Select
            name="currency"
            defaultValue={profile?.currency ?? "VND"}
            className="text-sm"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button type="submit">Lưu</Button>
        </form>
      </Card>

      <Card className="flex flex-col divide-y divide-ink/10 p-0">
        <ListRow
          href="/together"
          label="Kết nối partner"
          value={partnerStatusLabel}
        />
        <ListRow href="/settings/categories" label="Quản lý danh mục" />
        <ListRow href="/settings/budgets" label="Ngân sách" />
        <ListRow href="/settings/export" label="Xuất CSV chi tiêu" external />
      </Card>

      <LogoutButton />
    </div>
  );
}
