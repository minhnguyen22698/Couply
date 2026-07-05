import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const VISIBILITY_LABEL: Record<string, string> = {
  private: "Riêng tư",
  shared: "Chia sẻ",
  fund: "Quỹ chung",
};

function escapeCsvField(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("spent_on, amount, note, visibility, categories(name)")
    .eq("user_id", user.id)
    .order("spent_on", { ascending: false });

  const header = ["Ngày", "Danh mục", "Số tiền", "Ghi chú", "Chia sẻ"];
  const rows = (expenses ?? []).map((e) => {
    const category = e.categories as unknown as { name: string } | null;
    return [
      e.spent_on,
      category?.name ?? "Khác",
      String(e.amount),
      e.note ?? "",
      VISIBILITY_LABEL[e.visibility] ?? e.visibility,
    ]
      .map(escapeCsvField)
      .join(",");
  });

  // Leading BOM so Excel opens Vietnamese diacritics as UTF-8 instead of mangling them.
  const csv = "﻿" + [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="couply-expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
