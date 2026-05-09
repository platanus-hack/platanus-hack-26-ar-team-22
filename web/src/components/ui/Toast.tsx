"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "./utils";

type ToastTone = "success" | "danger" | "warning" | "info";
type ToastMessage = { id: string; title: string; description?: string; tone: ToastTone };
type ToastContextValue = {
  showToast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const tones: Record<ToastTone, string> = {
  success: "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200",
  danger: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-200",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast: (message) => {
        const id = crypto.randomUUID();
        setMessages((current) => [...current, { ...message, id }]);
        window.setTimeout(() => {
          setMessages((current) => current.filter((item) => item.id !== id));
        }, 3600);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {messages.map((message) => (
          <div key={message.id} className={cn("rounded-2xl border p-4 shadow-lg backdrop-blur", tones[message.tone])}>
            <div className="text-sm font-semibold">{message.title}</div>
            {message.description ? <div className="mt-1 text-sm opacity-85">{message.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
