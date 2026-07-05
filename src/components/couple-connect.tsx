"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvite, joinInvite } from "@/app/(app)/together/actions";

export function CoupleConnect({ pendingCode }: { pendingCode: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCreateInvite() {
    setError(null);
    startTransition(async () => {
      const result = await createInvite();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleJoin(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await joinInvite(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleCopy() {
    if (!pendingCode) return;
    await navigator.clipboard.writeText(pendingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (pendingCode) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/60">
          Chia sẻ mã này với partner để ghép cặp
        </p>
        <p className="text-center font-[family-name:var(--font-mono)] text-4xl tracking-[0.3em]">
          {pendingCode}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded-2xl border border-ink/15 px-4 py-2.5 text-sm"
          >
            {copied ? "Đã sao chép" : "Sao chép mã"}
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="flex-1 rounded-2xl bg-a px-4 py-2.5 text-sm text-paper"
          >
            Đã ghép xong?
          </button>
        </div>
        {error && <p className="text-sm text-a">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/60">Chưa kết nối với ai</p>
        <button
          type="button"
          onClick={handleCreateInvite}
          disabled={isPending}
          className="rounded-2xl bg-a px-4 py-3 font-medium text-paper disabled:opacity-60"
        >
          Tạo mã mời
        </button>
      </div>

      <form
        action={handleJoin}
        className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5"
      >
        <p className="text-sm text-ink/60">Đã có mã mời từ partner?</p>
        <input
          name="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="Nhập mã 6 số"
          required
          className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-center font-[family-name:var(--font-mono)] text-xl tracking-[0.3em]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl border border-ink/15 px-4 py-2.5 text-sm disabled:opacity-60"
        >
          {isPending ? "Đang ghép…" : "Ghép cặp"}
        </button>
      </form>

      {error && <p className="text-sm text-a">{error}</p>}
    </div>
  );
}
