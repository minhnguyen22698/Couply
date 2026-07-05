"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectPartner } from "@/app/(app)/together/actions";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type SharedExpenseItem = {
  id: string;
  amount: number;
  note: string | null;
  visibility: "shared" | "fund";
  ownerName: string;
  isMine: boolean;
  categoryIcon: string;
  categoryName: string;
};

const VISIBILITY_LABEL: Record<SharedExpenseItem["visibility"], string> = {
  shared: "Chia sẻ",
  fund: "Quỹ chung",
};

export function TogetherView({
  partnerName,
  currency,
  myTotal,
  partnerTotal,
  items,
}: {
  partnerName: string;
  currency: string;
  myTotal: number;
  partnerTotal: number;
  items: SharedExpenseItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const combined = myTotal + partnerTotal;
  const myShare = combined > 0 ? Math.round((myTotal / combined) * 100) : 50;

  function handleDisconnect() {
    if (!confirm(`Ngắt kết nối với ${partnerName}?`)) return;
    startTransition(async () => {
      await disconnectPartner();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm text-ink/60">Chia sẻ tháng này</p>
        <div className="mt-2 flex justify-between font-[family-name:var(--font-mono)] text-sm">
          <span className="text-a">Bạn: {formatCurrency(myTotal, currency)}</span>
          <span className="text-b">
            {partnerName}: {formatCurrency(partnerTotal, currency)}
          </span>
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full bg-a" style={{ width: `${myShare}%` }} />
          <div className="h-full bg-b" style={{ width: `${100 - myShare}%` }} />
        </div>
      </Card>

      <Card>
        <p className="text-sm text-ink/60">Chi tiêu chia sẻ</p>
        {items.length > 0 ? (
          <div className="mt-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-ink/10 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.categoryIcon}</span>
                  <span className="flex flex-col">
                    <span className="text-sm">
                      {item.categoryName} ·{" "}
                      {item.isMine ? "Bạn" : item.ownerName}
                    </span>
                    <span className="text-xs text-ink/50">
                      {VISIBILITY_LABEL[item.visibility]}
                      {item.note ? ` · ${item.note}` : ""}
                    </span>
                  </span>
                </div>
                <span className="font-[family-name:var(--font-mono)]">
                  {formatCurrency(item.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-ink/40">Chưa có khoản chi chia sẻ nào.</p>
        )}
      </Card>

      <Button
        type="button"
        variant="danger-outline"
        onClick={handleDisconnect}
        disabled={isPending}
        className="w-fit"
      >
        Ngắt kết nối partner
      </Button>
    </div>
  );
}
