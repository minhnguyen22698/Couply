import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

const CURRENCIES = ["VND", "USD"];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, currency, onboarded")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-paper px-6 pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] text-ink">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Chào mừng đến với Couply
        </h1>
        <p className="text-ink/70">Xác nhận vài thông tin trước khi bắt đầu</p>
      </div>

      <form
        action={completeOnboarding}
        className="flex w-full max-w-xs flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="displayName" className="text-sm text-ink/70">
            Tên hiển thị
          </label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={profile?.display_name ?? ""}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="currency" className="text-sm text-ink/70">
            Tiền tệ
          </label>
          <Select
            id="currency"
            name="currency"
            defaultValue={profile?.currency ?? "VND"}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <p className="text-sm text-danger">Có lỗi xảy ra, vui lòng thử lại.</p>
        )}

        <Button type="submit" size="lg">
          Bắt đầu
        </Button>
      </form>
    </main>
  );
}
