"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-paper px-6 py-16 text-ink">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Couply
        </h1>
        <p className="text-ink/70">Quản lý chi tiêu cùng người ấy</p>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-a px-5 py-3 font-medium text-paper transition-opacity disabled:opacity-60"
      >
        {isLoading ? "Đang chuyển hướng…" : "Tiếp tục với Google"}
      </button>

      {error && <p className="text-sm text-a">{error}</p>}
    </main>
  );
}
