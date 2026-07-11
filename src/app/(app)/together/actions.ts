"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CoupleActionState = { error?: string } | undefined;

function friendlyError(message: string) {
  if (message.includes("already_paired")) {
    return "Bạn đã ghép cặp với người khác rồi.";
  }
  if (message.includes("invalid_code")) {
    return "Mã mời không đúng hoặc đã hết hạn.";
  }
  if (message.includes("cannot_join_own_invite")) {
    return "Không thể dùng mã mời của chính mình.";
  }
  return "Có lỗi xảy ra, thử lại.";
}

export async function createInvite(): Promise<{
  code?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("create_invite");
  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/together");
  return { code: data as string };
}

export async function joinInvite(
  _prevState: CoupleActionState,
  formData: FormData,
): Promise<CoupleActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Mã mời gồm 6 chữ số." };

  const { error } = await supabase.rpc("join_couple", {
    p_invite_code: code,
  });
  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/together");
  return undefined;
}

export async function disconnectPartner(): Promise<CoupleActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("leave_couple");
  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/together");
  return undefined;
}
