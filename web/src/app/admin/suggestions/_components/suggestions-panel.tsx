"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useState, useTransition } from "react";

type Suggestion = {
  id: string;
  proposedSlug: string;
  proposedDomain: string;
  proposedRule: string;
  proposedAction: string;
  proposedSeverity: string;
  sourceHint: string | null;
  status: string;
  matchCount: number;
};

const DOMAIN_LABELS: Record<string, string> = {
  credentials: "credenciales",
  pii: "PII",
  internal_paths: "paths internos",
  business_policy: "policy de negocio",
  code: "código",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "baja",
  medium: "media",
  high: "alta",
};

const ACTION_STYLES: Record<string, string> = {
  BLOCK: "bg-red-500/10 text-red-700",
  REDACT: "bg-amber-500/10 text-amber-700",
  WARN: "bg-orange-500/10 text-orange-700",
  LOG: "bg-zinc-500/10 text-zinc-700",
};

export function SuggestionsPanel({
  initialSuggestions,
}: {
  initialSuggestions: Suggestion[];
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [, startTransition] = useTransition();

  async function refresh() {
    const res = await fetch("/api/admin/suggestions", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const rows: Suggestion[] = data.suggestions;
      startTransition(() =>
        setSuggestions([
          ...rows.filter((r) => r.sourceHint === "google_workspace"),
          ...rows.filter((r) => r.sourceHint !== "google_workspace"),
        ])
      );
    }
  }

  async function decide(id: string, action: "accept" | "reject") {
    const res = await fetch(`/api/admin/suggestions/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) await refresh();
  }

  const pending = suggestions.filter((s) => s.status === "pending");
  const decided = suggestions.filter((s) => s.status !== "pending");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // {pending.length} pendientes
        </span>
        {pending.length === 0 ? (
          <p className="font-mono text-xs text-graphite">
            // sin sugerencias pendientes. importá un Google Doc desde{" "}
            <a href="/admin/rules" className="underline">
              reglas
            </a>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((s) => (
              <SuggestionCard key={s.id} s={s} onDecide={decide} />
            ))}
          </ul>
        )}
      </div>

      {decided.length > 0 && (
        <div className="flex flex-col gap-4">
          <span className="font-mono text-xs uppercase tracking-wider text-graphite">
            // historial · {decided.length}
          </span>
          <ul className="flex flex-col gap-3 opacity-60">
            {decided.map((s) => (
              <SuggestionCard key={s.id} s={s} onDecide={decide} decided />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  s,
  onDecide,
  decided = false,
}: {
  s: Suggestion;
  onDecide: (id: string, action: "accept" | "reject") => void;
  decided?: boolean;
}) {
  return (
    <li
      className="border border-graphite-dark/20 p-5"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-medium text-ink">
          {s.proposedSlug}
        </span>

        {s.sourceHint === "google_workspace" && (
          <span className="border border-graphite-dark/30 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-graphite">
            // gdoc
          </span>
        )}

        <span
          className={`inline-flex items-center px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${ACTION_STYLES[s.proposedAction] ?? ""}`}
          style={{ borderRadius: "var(--radius)" }}
        >
          {s.proposedAction}
        </span>

        <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-graphite">
          {s.status}
        </span>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-graphite-dark">
        {s.proposedRule}
      </p>

      <div className="flex items-center gap-4 font-mono text-[11px] text-graphite">
        <span>{DOMAIN_LABELS[s.proposedDomain] ?? s.proposedDomain}</span>
        <span>·</span>
        <span>severidad {SEVERITY_LABELS[s.proposedSeverity] ?? s.proposedSeverity}</span>
        {s.matchCount > 0 && (
          <>
            <span>·</span>
            <span>{s.matchCount} matches retroactivos</span>
          </>
        )}
      </div>

      {!decided && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onDecide(s.id, "accept")}
            className="inline-flex items-center bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-graphite-dark"
            style={{ borderRadius: "var(--radius)" }}
          >
            aceptar
          </button>
          <button
            type="button"
            onClick={() => onDecide(s.id, "reject")}
            className="font-mono text-xs uppercase tracking-wider text-graphite transition-colors hover:text-ink"
          >
            rechazar
          </button>
        </div>
      )}
    </li>
  );
}
