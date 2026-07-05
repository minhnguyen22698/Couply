"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type NotificationPayload = {
  owner_name: string;
  amount: number;
  visibility: "shared" | "fund";
};

const VISIBILITY_LABEL: Record<NotificationPayload["visibility"], string> = {
  shared: "khoản chi chia sẻ",
  fund: "khoản đóng góp quỹ chung",
};

export function RealtimeNotifications({
  userId,
  initialUnreadCount,
}: {
  userId: string;
  initialUnreadCount: number;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // Realtime needs the JWT set on the socket *before* subscribing so RLS
    // can match `user_id = auth.uid()` — subscribing immediately after
    // client creation can race ahead of session hydration and silently
    // deliver zero events.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const data = payload.new.payload as NotificationPayload;
            setUnreadCount((count) => count + 1);
            setToast(
              `🔔 ${data.owner_name} vừa thêm ${VISIBILITY_LABEL[data.visibility] ?? "khoản chi chia sẻ"}`,
            );
            setTimeout(() => setToast(null), 4000);
          },
        )
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Realtime notifications subscription failed", err);
          }
        });
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <>
      <Link
        href="/notifications"
        onClick={() => setUnreadCount(0)}
        className="fixed right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-a px-1 text-xs text-paper">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      {toast && (
        <div className="fixed inset-x-4 top-16 z-30 rounded-2xl bg-ink px-4 py-3 text-sm text-paper shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
