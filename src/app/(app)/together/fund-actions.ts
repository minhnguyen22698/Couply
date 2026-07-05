"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FundActionState = { error?: string } | undefined;

function parseAmount(raw: FormDataEntryValue | null) {
  const amount = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export async function contributeToFund(
  fundId: string,
  _prevState: FundActionState,
  formData: FormData,
): Promise<FundActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const amount = parseAmount(formData.get("amount"));
  if (!amount) return { error: "Số tiền không hợp lệ." };
  const note = String(formData.get("note") ?? "").trim() || null;

  const { error } = await supabase.from("fund_contributions").insert({
    fund_id: fundId,
    user_id: user.id,
    amount,
    note,
  });

  if (error) return { error: "Không lưu được, thử lại." };

  revalidatePath("/together");
  return undefined;
}

export async function setFundGoal(
  fundId: string,
  _prevState: FundActionState,
  formData: FormData,
): Promise<FundActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = String(formData.get("goalAmount") ?? "").trim();
  const goalAmount = raw ? Number(raw.replace(/[^0-9.]/g, "")) : null;
  if (raw && (!goalAmount || goalAmount <= 0)) {
    return { error: "Mục tiêu không hợp lệ." };
  }

  const { error } = await supabase
    .from("shared_funds")
    .update({ goal_amount: goalAmount })
    .eq("id", fundId);

  if (error) return { error: "Không lưu được, thử lại." };

  revalidatePath("/together");
  return undefined;
}
