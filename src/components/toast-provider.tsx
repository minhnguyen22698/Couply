"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastVariant = "info" | "error";
type ToastState = { message: string; variant: ToastVariant } | null;
type NotifyFn = (message: string, variant?: ToastVariant) => void;

const ToastContext = createContext<NotifyFn | null>(null);

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used within ToastProvider");
  return notify;
}

/**
 * Single shared toast slot for the whole (app) shell — every async action
 * (delete, disconnect, logout...) reports failure through the same
 * `notify(message, "error")` call instead of ad-hoc inline text, so
 * "does this button tell me when it fails" has one consistent answer.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback<NotifyFn>((message, variant = "info") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, variant });
    timeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div
          aria-live="polite"
          className={`fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-30 rounded-2xl px-4 py-3 text-sm shadow-lg ${
            toast.variant === "error" ? "bg-danger text-paper" : "bg-ink text-paper"
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
