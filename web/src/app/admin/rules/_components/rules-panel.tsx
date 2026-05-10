"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useState, useTransition } from "react";
import { ConfirmDialog, Toast, type ConfirmConfig, type ToastState } from "@/components/feedback";
import {
  ADMIN_ACTIONS,
  POLICY_DOMAINS,
  SEVERITIES,
  type AdminAction,
  type PolicyDomain,
  type RuleDTO,
  type Severity,
} from "@/lib/policies";

const DOMAIN_LABELS: Record<PolicyDomain, string> = {
  credentials: "credenciales",
  pii: "PII",
  internal_paths: "paths internos",
  business_policy: "policy de negocio",
  code: "código",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  low: "baja",
  medium: "media",
  high: "alta",
};

type FormState = {
  name: string;
  rule: string;
  domain: PolicyDomain;
  defaultAction: AdminAction;
  severity: Severity;
};

const EMPTY: FormState = {
  name: "",
  rule: "",
  domain: "credentials",
  defaultAction: "BLOCK",
  severity: "medium",
};

export function RulesPanel({ initialRules }: { initialRules: RuleDTO[] }) {
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(initialRules.length === 0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState>(null);
  const [pendingDelete, setPendingDelete] = useState<RuleDTO | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/rules", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { rules: RuleDTO[] };
      startTransition(() => setRules(data.rules));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "no se pudo crear");
        return;
      }
      setForm(EMPTY);
      setShowForm(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(rule: RuleDTO) {
    const res = await fetch(`/api/admin/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    if (res.ok) await refresh();
  }

  function handleDelete(rule: RuleDTO) {
    setPendingDelete(rule);
  }

  async function confirmDelete() {
    const rule = pendingDelete;
    setPendingDelete(null);
    if (!rule) return;
    const res = await fetch(`/api/admin/rules/${rule.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setToast({ kind: "success", message: `Regla "${rule.slug}" eliminada` });
      await refresh();
    } else {
      const data = await res.json().catch(() => null);
      setToast({ kind: "error", message: data?.error ?? "no se pudo borrar" });
    }
  }

  const deleteConfig: ConfirmConfig | null = pendingDelete
    ? {
        title: `¿Borrar regla "${pendingDelete.slug}"?`,
        body: `Va a dejar de evaluarse en el próximo prompt. Los eventos pasados se mantienen para auditoría.`,
        confirmLabel: "Borrar",
        cancelLabel: "Cancelar",
        destructive: true,
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={pendingDelete !== null}
        config={deleteConfig}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // {rules.length} reglas · {rules.filter((r) => r.isActive).length} activas
        </span>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-graphite-dark"
          style={{ borderRadius: "var(--radius)" }}
        >
          {showForm ? "cerrar" : "+ nueva regla"}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="grid gap-5 border border-graphite-dark/20 bg-paper p-6 md:grid-cols-2"
          style={{ borderRadius: "var(--radius)" }}
        >
          <Field label="nombre · slug auto" hint="ej. customer-name-mention">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-graphite-dark/30 bg-paper px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
            />
          </Field>
          <Field label="dominio">
            <select
              value={form.domain}
              onChange={(e) =>
                setForm({ ...form, domain: e.target.value as PolicyDomain })
              }
              className="w-full border border-graphite-dark/30 bg-paper px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
            >
              {POLICY_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABELS[d]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="qué bloquear · descripción NL"
            hint="el judge ve este texto + el prompt del usuario y decide si matchea"
            full
          >
            <textarea
              required
              rows={3}
              value={form.rule}
              onChange={(e) => setForm({ ...form, rule: e.target.value })}
              placeholder="ej. no mencionar nombres de clientes (Acme, Globex, Initech)"
              className="w-full resize-y border border-graphite-dark/30 bg-paper px-3 py-2 font-sans text-sm leading-relaxed focus:border-ink focus:outline-none"
            />
          </Field>
          <Field label="acción si matchea">
            <select
              value={form.defaultAction}
              onChange={(e) =>
                setForm({ ...form, defaultAction: e.target.value as AdminAction })
              }
              className="w-full border border-graphite-dark/30 bg-paper px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
            >
              {ADMIN_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="severidad">
            <select
              value={form.severity}
              onChange={(e) =>
                setForm({ ...form, severity: e.target.value as Severity })
              }
              className="w-full border border-graphite-dark/30 bg-paper px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          {error ? (
            <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-ink md:col-span-2">
              <span aria-hidden className="h-3 w-1 bg-ink" />
              // error · {error}
            </p>
          ) : null}
          <div className="flex items-center gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-graphite-dark disabled:opacity-60"
              style={{ borderRadius: "var(--radius)" }}
            >
              {submitting ? "guardando…" : "crear regla"}
            </button>
            <span className="font-mono text-[11px] text-graphite">
              // se aplica al próximo prompt sin reload
            </span>
          </div>
        </form>
      ) : null}

      <div
        className="overflow-hidden border border-graphite-dark/20"
        style={{ borderRadius: "var(--radius)" }}
      >
        <table className="w-full text-left">
          <thead className="bg-paper-soft/40 font-mono text-[11px] uppercase tracking-wider text-graphite">
            <tr>
              <th className="px-4 py-3">slug</th>
              <th className="px-4 py-3">descripción</th>
              <th className="px-4 py-3">dominio</th>
              <th className="px-4 py-3">acción</th>
              <th className="px-4 py-3">sev</th>
              <th className="px-4 py-3 text-right">estado</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8">
                  <div className="flex flex-col items-start gap-2 text-graphite-dark">
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-graphite">
                      // sin reglas todavía
                    </span>
                    <p className="text-sm leading-relaxed">
                      Llená el formulario de arriba o importá un Google Doc
                      con políticas — el proxy recoge la regla en el próximo
                      prompt, sin reload.
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}
            {rules.map((r) => (
              <tr
                key={r.id}
                className="border-t border-graphite-dark/15 align-top"
              >
                <td className="px-4 py-3 font-mono text-xs text-ink">{r.slug}</td>
                <td className="max-w-md px-4 py-3 text-sm text-graphite-dark">
                  <span className="line-clamp-2">{r.rule}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-graphite">
                  {DOMAIN_LABELS[r.domain]}
                </td>
                <td className="px-4 py-3">
                  <ActionTag action={r.defaultAction} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-graphite">
                  {SEVERITY_LABELS[r.severity]}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(r)}
                      className={`inline-flex items-center px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                        r.isActive
                          ? "border border-ink bg-ink text-paper hover:bg-graphite-dark"
                          : "border border-graphite-dark/30 text-graphite hover:border-ink hover:text-ink"
                      }`}
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      {r.isActive ? "activa" : "pausada"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="font-mono text-[11px] uppercase tracking-wider text-graphite transition-colors hover:font-semibold hover:text-ink"
                    >
                      borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  full = false,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2 ${full ? "md:col-span-2" : ""}`}>
      <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
        // {label}
      </span>
      {children}
      {hint ? (
        <span className="font-mono text-[11px] text-graphite">{hint}</span>
      ) : null}
    </label>
  );
}

// Monochrome ActionTag — severity reads as text weight + a 4px left bar
// that darkens with severity. Functional color is reserved for the live
// events feed (see identidad/design.md § 6).
function ActionTag({ action }: { action: RuleDTO["defaultAction"] }) {
  const weight: Record<RuleDTO["defaultAction"], string> = {
    LOG: "font-normal",
    WARN: "font-medium",
    REDACT: "font-semibold",
    BLOCK: "font-bold",
  };
  const indicator: Record<RuleDTO["defaultAction"], string> = {
    LOG: "bg-graphite",
    WARN: "bg-graphite-dark",
    REDACT: "bg-ink/80",
    BLOCK: "bg-ink",
  };
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink">
      <span aria-hidden className={`h-3.5 w-1 ${indicator[action]}`} />
      <span className={weight[action]}>{action}</span>
    </span>
  );
}
