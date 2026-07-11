"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";

export function LogoutButton() {
  const router = useRouter();
  const notify = useToast();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        notify("Đăng xuất thất bại, thử lại.", "error");
        return;
      }
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      loading={isPending}
      className="w-fit"
    >
      Đăng xuất
    </Button>
  );
}
