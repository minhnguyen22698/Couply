import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded) {
    redirect("/onboarding");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const { data: activeCouple } = await supabase
    .from("couples")
    .select("id")
    .eq("status", "active")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .maybeSingle();

  return (
    <AppShell
      categories={categories ?? []}
      userId={user.id}
      hasPartner={!!activeCouple}
    >
      {children}
    </AppShell>
  );
}
