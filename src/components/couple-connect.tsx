"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvite, joinInvite } from "@/app/(app)/together/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      <Card className="flex flex-col gap-4">
        <p className="text-sm text-ink/60">
          Chia sẻ mã này với partner để ghép cặp
        </p>
        <p className="text-center font-[family-name:var(--font-mono)] tabular-nums text-4xl tracking-[0.3em]">
          {pendingCode}
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? "Đã sao chép" : "Sao chép mã"}
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={() => router.refresh()}
            className="flex-1"
          >
            Đã ghép xong?
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-ink/60">Chưa kết nối với ai</p>
        <Button
          type="button"
          size="lg"
          onClick={handleCreateInvite}
          disabled={isPending}
        >
          Tạo mã mời
        </Button>
      </Card>

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
          className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-center font-[family-name:var(--font-mono)] tabular-nums text-xl tracking-[0.3em]"
        />
        <Button type="submit" variant="outline" size="lg" disabled={isPending}>
          {isPending ? "Đang ghép…" : "Ghép cặp"}
        </Button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
