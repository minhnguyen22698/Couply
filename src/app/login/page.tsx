"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-paper px-6 pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] text-ink">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Couply
        </h1>
        <p className="text-ink/70">Quản lý chi tiêu cùng người ấy</p>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full max-w-xs"
      >
        {isLoading ? "Đang chuyển hướng…" : "Tiếp tục với Google"}
      </Button>

      {error && <p className="text-sm text-danger">{error}</p>}
    </main>
  );
}
