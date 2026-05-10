"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

// Componentes de feedback: Toast efímero + ConfirmDialog inline.
// Sin dep externa — todo el state lo maneja el caller.

import { useEffect, useRef } from "react";

// =============================================================
// Toast: notificación efímera arriba a la derecha.
// =============================================================

export type ToastKind = "info" | "success" | "error";
export type ToastState = { kind: ToastKind; message: string } | null;

const TOAST_TONE: Record<ToastKind, { dot: string; border: string; bg: string }> = {
  info: { dot: "bg-graphite", border: "border-graphite-dark/30", bg: "bg-paper" },
  success: { dot: "bg-emerald-500", border: "border-emerald-500/40", bg: "bg-paper" },
  error: { dot: "bg-red-500", border: "border-red-500/40", bg: "bg-paper" },
};

export function Toast({
  toast,
  onClose,
  durationMs = 4000,
}: {
  toast: ToastState;
  onClose: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [toast, onClose, durationMs]);

  if (!toast) return null;
  const tone = TOAST_TONE[toast.kind];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 top-6 z-50 max-w-sm animate-in fade-in slide-in-from-top-2"
    >
      <div
        className={`flex items-start gap-3 border ${tone.border} ${tone.bg} px-4 py-3 shadow-lg`}
        style={{ borderRadius: "var(--radius)" }}
      >
        <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
        <p className="flex-1 text-sm leading-snug text-ink">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="cerrar"
          className="font-mono text-[11px] uppercase tracking-wider text-graphite hover:text-ink"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// =============================================================
// ConfirmDialog: modal accesible para confirmar acciones destructivas.
// =============================================================

export type ConfirmConfig = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  config,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  config: ConfirmConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Cerrar con Escape, atrapar Tab adentro, y mover el foco a Cancelar
  // cuando abre. Devuelve el foco al elemento que originó el modal cuando
  // cierra.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    // Default-cancel for destructive actions: foco arranca en Cancelar.
    requestAnimationFrame(() => cancelRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const card = cardRef.current;
      if (!card) return;
      const focusables = Array.from(
        card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("aria-hidden"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onCancel]);

  if (!open || !config) return null;

  const confirmLabel = config.confirmLabel ?? "Confirmar";
  const cancelLabel = config.cancelLabel ?? "Cancelar";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-md border border-graphite-dark/30 bg-paper p-6 shadow-xl"
        style={{ borderRadius: "var(--radius)" }}
      >
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // confirmar
        </span>
        <h2 id="confirm-title" className="mt-2 text-lg font-semibold tracking-tight text-ink">
          {config.title}
        </h2>
        {config.body ? (
          <p className="mt-2 text-sm leading-relaxed text-graphite-dark">{config.body}</p>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="border border-graphite-dark/30 px-4 py-2 font-mono text-xs uppercase tracking-wider text-graphite transition-colors hover:border-ink hover:text-ink"
            style={{ borderRadius: "var(--radius)" }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper transition-colors ${
              config.destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-ink hover:bg-graphite-dark"
            }`}
            style={{ borderRadius: "var(--radius)" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
