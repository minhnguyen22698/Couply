"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const currency = String(formData.get("currency") ?? "VND");

  if (!displayName) {
    redirect("/onboarding?error=missing-name");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, currency, onboarded: true })
    .eq("id", user.id);

  if (error) {
    redirect("/onboarding?error=save-failed");
  }

  redirect("/dashboard");
}
