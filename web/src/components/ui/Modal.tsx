"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "./utils";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export function Modal({ open, title, description, children, onClose, footer }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn("w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl")}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar modal">
            X
          </Button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="flex justify-end gap-3 border-t border-border p-5">{footer}</div> : null}
      </div>
    </div>
  );
}
