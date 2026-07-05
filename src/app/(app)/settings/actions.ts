"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SUPPORTED_CURRENCIES = ["VND", "USD"];

export async function updateCurrency(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currency = String(formData.get("currency") ?? "");
  if (!SUPPORTED_CURRENCIES.includes(currency)) redirect("/settings");

  await supabase
    .from("profiles")
    .update({ currency })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/together");
  redirect("/settings");
}
