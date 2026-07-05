"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "📦";
  if (!name) redirect("/settings/categories?error=empty-name");

  const { error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name, icon });

  if (error) redirect("/settings/categories?error=save-failed");

  revalidatePath("/settings/categories");
  redirect("/settings/categories");
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  redirect("/settings/categories");
}
