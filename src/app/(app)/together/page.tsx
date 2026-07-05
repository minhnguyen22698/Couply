import { createClient } from "@/lib/supabase/server";
import { CoupleConnect } from "@/components/couple-connect";
import {
  TogetherView,
  type SharedExpenseItem,
} from "@/components/together-view";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

export default async function TogetherPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user!.id)
    .single();
  const currency = profile?.currency ?? "VND";

  const { data: couple } = await supabase
    .from("couples")
    .select("id, user_a_id, user_b_id, invite_code, status")
    .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!couple || couple.status !== "active") {
    const pendingCode =
      couple?.status === "pending" && couple.user_a_id === user!.id
        ? couple.invite_code
        : null;

    return (
      <div className="flex flex-col gap-4 px-5 pt-10">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">
          Chúng ta
        </h1>
        <CoupleConnect pendingCode={pendingCode} />
      </div>
    );
  }

  const partnerId =
    couple.user_a_id === user!.id ? couple.user_b_id : couple.user_a_id;

  const { data: partnerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", partnerId!)
    .single();
  const partnerName = partnerProfile?.display_name ?? "Partner";

  const { start, end } = currentMonthRange();

  const { data: sharedExpenses } = await supabase
    .from("expenses")
    .select(
      "id, user_id, amount, note, visibility, spent_on, categories(name, icon)",
    )
    .eq("couple_id", couple.id)
    .neq("visibility", "private")
    .gte("spent_on", start)
    .lt("spent_on", end)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  const items: SharedExpenseItem[] = (sharedExpenses ?? []).map((row) => {
    const category = row.categories as unknown as {
      name: string;
      icon: string;
    } | null;
    return {
      id: row.id,
      amount: Number(row.amount),
      note: row.note,
      visibility: row.visibility as "shared" | "fund",
      ownerName: row.user_id === user!.id ? "Bạn" : partnerName,
      isMine: row.user_id === user!.id,
      categoryIcon: category?.icon ?? "📦",
      categoryName: category?.name ?? "Khác",
    };
  });

  const myTotal = items
    .filter((item) => item.isMine)
    .reduce((sum, item) => sum + item.amount, 0);
  const partnerTotal = items
    .filter((item) => !item.isMine)
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Chúng ta
      </h1>
      <TogetherView
        partnerName={partnerName}
        currency={currency}
        myTotal={myTotal}
        partnerTotal={partnerTotal}
        items={items}
      />
    </div>
  );
}
