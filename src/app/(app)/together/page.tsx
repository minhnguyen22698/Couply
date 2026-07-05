import { createClient } from "@/lib/supabase/server";
import { CoupleConnect } from "@/components/couple-connect";
import {
  TogetherView,
  type SharedExpenseItem,
} from "@/components/together-view";
import { FundCard, type FundContributionItem } from "@/components/fund-card";
import { PageHeader } from "@/components/ui/page-header";

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

  const [{ data: profile }, { data: couple }] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user!.id).single(),
    supabase
      .from("couples")
      .select("id, user_a_id, user_b_id, invite_code, status")
      .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const currency = profile?.currency ?? "VND";

  if (!couple || couple.status !== "active") {
    const pendingCode =
      couple?.status === "pending" && couple.user_a_id === user!.id
        ? couple.invite_code
        : null;

    return (
      <div className="flex flex-col gap-4 px-5 pt-10">
        <PageHeader title="Chúng ta" />
        <CoupleConnect pendingCode={pendingCode} />
      </div>
    );
  }

  const partnerId =
    couple.user_a_id === user!.id ? couple.user_b_id : couple.user_a_id;

  const { start, end } = currentMonthRange();

  const [{ data: partnerProfile }, { data: sharedExpenses }, { data: existingFund }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", partnerId!)
        .single(),
      supabase
        .from("expenses")
        .select(
          "id, user_id, amount, note, visibility, spent_on, categories(name, icon)",
        )
        .eq("couple_id", couple.id)
        .neq("visibility", "private")
        .gte("spent_on", start)
        .lt("spent_on", end)
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("shared_funds")
        .select("id, goal_amount")
        .eq("couple_id", couple.id)
        .maybeSingle(),
    ]);
  const partnerName = partnerProfile?.display_name ?? "Partner";

  let fund = existingFund;
  if (!fund) {
    const { data: created } = await supabase
      .from("shared_funds")
      .insert({ couple_id: couple.id })
      .select("id, goal_amount")
      .single();
    fund = created;
  }

  const [{ data: contributions }, { data: fundExpenses }] = await Promise.all([
    supabase
      .from("fund_contributions")
      .select("id, user_id, amount, note, created_at")
      .eq("fund_id", fund!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("amount")
      .eq("couple_id", couple.id)
      .eq("visibility", "fund"),
  ]);

  const fundContributionItems: FundContributionItem[] = (
    contributions ?? []
  ).map((c) => ({
    id: c.id,
    amount: Number(c.amount),
    note: c.note,
    ownerName: c.user_id === user!.id ? "Bạn" : partnerName,
    isMine: c.user_id === user!.id,
  }));

  const totalContributions = (contributions ?? []).reduce(
    (sum, c) => sum + Number(c.amount),
    0,
  );
  const totalFundExpenses = (fundExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const fundBalance = totalContributions - totalFundExpenses;

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
      <PageHeader title="Chúng ta" />
      <TogetherView
        partnerName={partnerName}
        currency={currency}
        myTotal={myTotal}
        partnerTotal={partnerTotal}
        items={items}
      />
      <FundCard
        fundId={fund!.id}
        goalAmount={fund!.goal_amount === null ? null : Number(fund!.goal_amount)}
        balance={fundBalance}
        currency={currency}
        contributions={fundContributionItems}
      />
    </div>
  );
}
