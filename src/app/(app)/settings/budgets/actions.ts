"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setBudget(
  categoryId: string,
  month: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = String(formData.get("amount") ?? "").trim();
  const amount = raw ? Number(raw.replace(/[^0-9.]/g, "")) : null;

  if (!raw || !amount || amount <= 0) {
    await supabase
      .from("budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .eq("month", month);
  } else {
    await supabase
      .from("budgets")
      .upsert(
        { user_id: user.id, category_id: categoryId, month, amount },
        { onConflict: "user_id,category_id,month" },
      );
  }

  revalidatePath("/dashboard");
  redirect(`/settings/budgets?month=${month.slice(0, 7)}`);
}
