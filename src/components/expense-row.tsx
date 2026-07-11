"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/app/(app)/expenses/actions";
import {
  type ExpenseCategory,
  type ExpenseRecord,
  useExpenseSheet,
} from "@/components/expense-sheet-context";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/toast-provider";

const SWIPE_THRESHOLD = 120; // px dragged left, on release, that triggers delete
const COLOR_FULL_AT = SWIPE_THRESHOLD * 0.5; // background reaches full red at 50% of the threshold
const DRAG_THRESHOLD = 6; // px before a pointer move counts as a drag, not a tap
const MAX_DRAG = SWIPE_THRESHOLD * 1.15; // slight rubber-band past the trigger point
const EXIT_SLIDE = 480; // px the row keeps sliding off-screen once delete is confirmed

// Mirrors --paper / --danger / --ink from globals.css — inline style needs
// plain numbers to interpolate frame-by-frame as the row is dragged.
const BASE_BG: [number, number, number] = [243, 250, 248];
const DANGER_BG: [number, number, number] = [192, 57, 43];
const BASE_FG: [number, number, number] = [27, 36, 34];
const DANGER_FG: [number, number, number] = [243, 250, 248];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mix(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
) {
  return `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(", ")})`;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ExpenseRow({
  expense,
  category,
  currency,
}: {
  expense: ExpenseRecord;
  category: ExpenseCategory | null;
  currency: string;
}) {
  const { openEdit } = useExpenseSheet();
  const router = useRouter();
  const notify = useToast();
  const [, startTransition] = useTransition();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  // "removing" plays the slide-out + collapse before the server call even
  // resolves, so deleting feels instant instead of waiting on the network;
  // a failed delete falls back to "idle" and the row reappears with a toast.
  const [phase, setPhase] = useState<"idle" | "removing">("idle");
  const dragStartX = useRef<number | null>(null);
  const moved = useRef(false);

  const progress = clamp(Math.abs(offset) / COLOR_FULL_AT, 0, 1);
  const removing = phase === "removing";

  function runDelete() {
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      if (result?.error) {
        notify(result.error, "error");
        setPhase("idle");
        setOffset(0);
        return;
      }
      router.refresh();
    });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (removing) return;
    dragStartX.current = e.clientX;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) moved.current = true;
    setOffset(clamp(delta, -MAX_DRAG, 0));
  }

  function endDrag() {
    if (dragStartX.current === null) return;
    dragStartX.current = null;
    setDragging(false);
    setOffset((current) => {
      if (Math.abs(current) >= SWIPE_THRESHOLD) {
        setPhase("removing");
        runDelete();
        // Keep sliding the same direction it was already moving instead
        // of stopping dead — the swipe and the delete read as one motion.
        return prefersReducedMotion() ? current : current - EXIT_SLIDE;
      }
      return 0;
    });
  }

  function handleRowClick() {
    // A drag-release also fires a click right after pointerup — swallow
    // that one so releasing a swipe never also opens the edit sheet.
    if (moved.current) {
      moved.current = false;
      return;
    }
    openEdit(expense);
  }

  // Water-drop grows from the anchor point behind the row, hitting full
  // size by the same 50%-of-threshold point the row finishes reddening —
  // both effects read as one continuous "this will delete" signal.
  const dropScale = 0.25 + progress * 0.75;
  const dropOpacity = removing ? 0 : clamp(progress / 0.3, 0, 1);
  const dropTransition = dragging
    ? "none"
    : "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease-out";

  return (
    <div
      className="motion-reduce:transition-none grid overflow-hidden border-b border-ink/10 transition-[grid-template-rows,opacity] duration-300 ease-in last:border-0"
      style={{
        gridTemplateRows: removing ? "0fr" : "1fr",
        opacity: removing ? 0 : 1,
      }}
    >
      <div className="relative min-h-0 touch-pan-y overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 flex w-24 items-center justify-center"
        >
          <div
            className="absolute rounded-[50%_50%_50%_0] bg-danger"
            style={{
              width: 40,
              height: 40,
              opacity: dropOpacity,
              transform: `rotate(-45deg) scale(${dropScale})`,
              transition: dropTransition,
            }}
          />
          <Trash2
            size={17}
            className="relative text-paper"
            style={{ opacity: dropOpacity, transition: dropTransition }}
          />
        </div>

        <div
          role="button"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={handleRowClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openEdit(expense);
          }}
          style={{
            transform: `translateX(${offset}px)`,
            backgroundColor: mix(BASE_BG, DANGER_BG, progress),
            color: mix(BASE_FG, DANGER_FG, progress),
            transition: dragging
              ? "none"
              : `transform ${removing ? 280 : 200}ms ${removing ? "ease-in" : "ease-out"}, background-color 200ms ease-out, color 200ms ease-out`,
            pointerEvents: removing ? "none" : undefined,
          }}
          className="relative z-10 flex items-center justify-between gap-3 py-3 text-left"
        >
          <div className="flex flex-1 items-center gap-3">
            <span className="text-xl">{category?.icon ?? "📦"}</span>
            <span className="flex flex-col">
              <span className="text-sm">{category?.name ?? "Khác"}</span>
              {expense.note && (
                <span className="text-xs opacity-60">{expense.note}</span>
              )}
            </span>
          </div>
          <span className="font-[family-name:var(--font-mono)] tabular-nums">
            {formatCurrency(expense.amount, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
