"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ExpenseFormState = { error?: string } | undefined;

function parseAmount(raw: FormDataEntryValue | null) {
  const amount = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseVisibility(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "private");
  return value === "shared" || value === "fund" ? value : "private";
}

async function resolveSharing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  visibility: "private" | "shared" | "fund",
) {
  if (visibility === "private") return { visibility, coupleId: null as string | null };

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("status", "active")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .maybeSingle();

  // No active partner — force private rather than trust an unpaired client's visibility.
  if (!couple) return { visibility: "private" as const, coupleId: null };

  return { visibility, coupleId: couple.id as string };
}

async function notifyPartner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  coupleId: string,
  amount: number,
  visibility: "shared" | "fund",
) {
  const { data: couple } = await supabase
    .from("couples")
    .select("user_a_id, user_b_id")
    .eq("id", coupleId)
    .single();
  if (!couple) return;

  const partnerId =
    couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;
  if (!partnerId) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  await supabase.from("notifications").insert({
    user_id: partnerId,
    type: "expense_shared",
    payload: {
      owner_name: profile?.display_name ?? "Đối tác",
      amount,
      visibility,
    },
  });
}

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const amount = parseAmount(formData.get("amount"));
  if (!amount) return { error: "Số tiền không hợp lệ." };

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const spentOn = String(formData.get("spentOn") ?? "") || undefined;
  const receiptPath = String(formData.get("receiptPath") ?? "") || null;
  const { visibility, coupleId } = await resolveSharing(
    supabase,
    user.id,
    parseVisibility(formData.get("visibility")),
  );

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    category_id: categoryId,
    amount,
    note,
    receipt_path: receiptPath,
    visibility,
    couple_id: coupleId,
    ...(spentOn ? { spent_on: spentOn } : {}),
  });

  if (error) return { error: "Không lưu được khoản chi, thử lại." };

  const notifyPartnerToggle = formData.get("notifyPartner") === "on";
  if (visibility !== "private" && coupleId && notifyPartnerToggle) {
    await notifyPartner(supabase, user.id, coupleId, amount, visibility);
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return undefined;
}

export async function updateExpense(
  expenseId: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const amount = parseAmount(formData.get("amount"));
  if (!amount) return { error: "Số tiền không hợp lệ." };

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const spentOn = String(formData.get("spentOn") ?? "") || undefined;
  const receiptPath = String(formData.get("receiptPath") ?? "") || null;
  const { visibility, coupleId } = await resolveSharing(
    supabase,
    user.id,
    parseVisibility(formData.get("visibility")),
  );

  const { data: existing } = await supabase
    .from("expenses")
    .select("receipt_path")
    .eq("id", expenseId)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("expenses")
    .update({
      category_id: categoryId,
      amount,
      note,
      receipt_path: receiptPath,
      visibility,
      couple_id: coupleId,
      ...(spentOn ? { spent_on: spentOn } : {}),
    })
    .eq("id", expenseId)
    .eq("user_id", user.id);

  if (error) return { error: "Không cập nhật được khoản chi, thử lại." };

  if (existing?.receipt_path && existing.receipt_path !== receiptPath) {
    await supabase.storage.from("receipts").remove([existing.receipt_path]);
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return undefined;
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("expenses")
    .select("receipt_path")
    .eq("id", expenseId)
    .eq("user_id", user.id)
    .single();

  await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", user.id);

  if (existing?.receipt_path) {
    await supabase.storage.from("receipts").remove([existing.receipt_path]);
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}
