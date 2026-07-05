import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";

type NotificationPayload = {
  owner_name: string;
  amount: number;
  visibility: "shared" | "fund";
};

const VISIBILITY_LABEL: Record<NotificationPayload["visibility"], string> = {
  shared: "chia sẻ",
  fund: "quỹ chung",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", user!.id).single(),
    supabase
      .from("notifications")
      .select("id, payload, is_read, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const currency = profile?.currency ?? "VND";

  const unreadIds = (notifications ?? [])
    .filter((n) => !n.is_read)
    .map((n) => n.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Thông báo
      </h1>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        {(notifications?.length ?? 0) > 0 ? (
          notifications!.map((n) => {
            const payload = n.payload as NotificationPayload;
            return (
              <div
                key={n.id}
                className="flex flex-col gap-1 border-b border-ink/10 py-3 last:border-0"
              >
                <p className="text-sm">
                  {payload.owner_name} vừa thêm khoản{" "}
                  {VISIBILITY_LABEL[payload.visibility] ?? "chia sẻ"}{" "}
                  <span className="font-[family-name:var(--font-mono)]">
                    {formatCurrency(payload.amount, currency)}
                  </span>
                </p>
                <p className="text-xs text-ink/40">
                  {new Date(n.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-ink/40">Chưa có thông báo nào.</p>
        )}
      </div>
    </div>
  );
}
