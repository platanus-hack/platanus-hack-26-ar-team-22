"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useState, useTransition, useRef } from "react";

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

const SOURCE_LABELS: Record<string, string> = {
  google_workspace: "gdoc",
  google_doc: "gdoc",
  drive_pdf: "drive pdf",
  drive_file: "drive file",
  pdf: "pdf",
  file: "archivo",
};

type SuggestorRunResult = {
  ok: boolean;
  analyzed?: number;
  proposed?: number;
  inserted?: number;
  skipped?: number;
  error?: string;
};

export function SuggestionsPanel({
  initialSuggestions,
}: {
  initialSuggestions: Suggestion[];
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<SuggestorRunResult | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/suggestions", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const rows: Suggestion[] = data.suggestions;
      startTransition(() =>
        setSuggestions([
          ...rows.filter((r) => r.sourceHint !== null),
          ...rows.filter((r) => r.sourceHint === null),
        ])
      );
    }
  }

  async function runAiSuggestor() {
    setRunning(true);
    setRunResult(null);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    try {
      const res = await fetch("/api/admin/suggestor/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as SuggestorRunResult;
      setRunResult(data);
      if (data.ok && (data.inserted ?? 0) > 0) {
        await refresh();
      }
    } catch {
      setRunResult({ ok: false, error: "Error de red al contactar el suggestor." });
    } finally {
      setRunning(false);
      clearTimerRef.current = setTimeout(() => setRunResult(null), 5000);
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
      {/* AI Suggestor trigger */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={runAiSuggestor}
            disabled={running}
            className="inline-flex items-center gap-2 border border-graphite-dark/25 px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-graphite-dark/5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "var(--radius)" }}
          >
            {running ? (
              <>
                <span
                  className="inline-block h-2 w-2 animate-pulse rounded-full bg-graphite"
                  aria-hidden="true"
                />
                analizando...
              </>
            ) : (
              "analizar con IA"
            )}
          </button>
        </div>

        {runResult && (
          <span
            className={`font-mono text-xs ${
              runResult.ok && (runResult.inserted ?? 0) > 0
                ? "text-emerald-700"
                : runResult.ok
                  ? "text-graphite"
                  : "text-red-700"
            }`}
          >
            {runResult.ok
              ? (runResult.inserted ?? 0) > 0
                ? `// ${runResult.inserted} nuevas sugerencias generadas`
                : "// sin patrones nuevos detectados"
              : `// error: ${runResult.error ?? "desconocido"}`}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // {pending.length} pendientes
        </span>
        {pending.length === 0 ? (
          <p className="font-mono text-xs text-graphite">
            // sin sugerencias pendientes. importá un documento desde{" "}
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

        {s.sourceHint && (
          <span className="border border-graphite-dark/30 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-graphite">
            // {SOURCE_LABELS[s.sourceHint] ?? s.sourceHint}
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
