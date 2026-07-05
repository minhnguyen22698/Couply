"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  contributeToFund,
  setFundGoal,
} from "@/app/(app)/together/fund-actions";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmountInput, Input } from "@/components/ui/input";

export type FundContributionItem = {
  id: string;
  amount: number;
  note: string | null;
  ownerName: string;
  isMine: boolean;
};

export function FundCard({
  fundId,
  goalAmount,
  balance,
  currency,
  contributions,
}: {
  fundId: string;
  goalAmount: number | null;
  balance: number;
  currency: string;
  contributions: FundContributionItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);

  const progress =
    goalAmount && goalAmount > 0
      ? Math.min(100, Math.round((balance / goalAmount) * 100))
      : null;

  function handleContribute(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await contributeToFund(fundId, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSetGoal(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setFundGoal(fundId, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditingGoal(false);
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">Quỹ chung</p>
        <button
          type="button"
          onClick={() => setEditingGoal((v) => !v)}
          className="text-sm text-a"
        >
          {goalAmount ? "Sửa mục tiêu" : "Đặt mục tiêu"}
        </button>
      </div>

      <p className="font-[family-name:var(--font-mono)] tabular-nums text-3xl">
        {formatCurrency(balance, currency)}
      </p>

      {progress !== null && (
        <div className="flex flex-col gap-1">
          <div className="h-2 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full bg-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-ink/50">
            {progress}% mục tiêu {formatCurrency(goalAmount!, currency)}
          </p>
        </div>
      )}

      {editingGoal && (
        <form action={handleSetGoal} className="flex gap-2">
          <AmountInput
            name="goalAmount"
            currency={currency}
            size="sm"
            placeholder="Số tiền mục tiêu"
            defaultValue={goalAmount ?? ""}
          />
          <Button type="submit" disabled={isPending}>
            Lưu
          </Button>
        </form>
      )}

      <form action={handleContribute} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <AmountInput
            name="amount"
            currency={currency}
            size="sm"
            placeholder="Đóng góp..."
            required
          />
          <Button type="submit" disabled={isPending}>
            Góp
          </Button>
        </div>
        <Input name="note" type="text" placeholder="Ghi chú (tuỳ chọn)" className="text-sm" />
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink/60">Lịch sử đóng góp</p>
        {contributions.length > 0 ? (
          contributions.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-b border-ink/10 py-2 text-sm last:border-0"
            >
              <span>
                {c.isMine ? "Bạn" : c.ownerName}
                {c.note ? ` · ${c.note}` : ""}
              </span>
              <span className="font-[family-name:var(--font-mono)] tabular-nums">
                {formatCurrency(c.amount, currency)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink/40">Chưa có đóng góp nào.</p>
        )}
      </div>
    </Card>
  );
}
