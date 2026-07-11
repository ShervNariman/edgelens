"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/release-demo/decision";

export type FeedbackTone = "success" | "error" | "info" | "warning";

export interface FeedbackMessage {
  id: string;
  tone: FeedbackTone;
  title: string;
  detail?: string;
}

interface FeedbackStore {
  push: (input: Omit<FeedbackMessage, "id">) => void;
  dismiss: (id: string) => void;
}

const FeedbackContext = createContext<FeedbackStore | null>(null);

const TONE_CLASS: Record<FeedbackTone, string> = {
  success:
    "border-[var(--rr-ready)]/25 bg-[var(--rr-ready-bg)] text-[var(--rr-ready)]",
  error:
    "border-[var(--rr-blocked)]/25 bg-[var(--rr-blocked-bg)] text-[var(--rr-blocked)]",
  warning:
    "border-[var(--rr-warn)]/25 bg-[var(--rr-warn-bg)] text-[var(--rr-warn)]",
  info: "border-[var(--rr-info)]/25 bg-[var(--rr-info-bg)] text-[var(--rr-info)]",
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const push = useCallback(
    (input: Omit<FeedbackMessage, "id">) => {
      const id = newId("fb");
      setMessages((prev) => [...prev, { ...input, id }].slice(-4));
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            role={message.tone === "error" ? "alert" : "status"}
            className={cn(
              "rr-toast pointer-events-auto rounded-xl border px-3.5 py-3 shadow-[0_16px_40px_-24px_rgba(12,18,34,0.55)]",
              TONE_CLASS[message.tone],
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--rr-ink)]">
                  {message.title}
                </p>
                {message.detail ? (
                  <p className="mt-0.5 text-xs text-[var(--rr-muted)]">
                    {message.detail}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(message.id)}
                className="rounded-md p-1 text-[var(--rr-muted)] transition-colors hover:bg-black/5 hover:text-[var(--rr-ink)]"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackStore {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
