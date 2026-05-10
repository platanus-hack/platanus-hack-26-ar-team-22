"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useState, useTransition, useRef } from "react";

type Suggestion = {
  id: string;
  proposedSlug: string;
  proposedDomain: string;
  proposedLayer?: string;
  proposedRule: string;
  proposedPattern?: string | null;
  proposedAction: string;
  proposedSeverity: string;
  sourceHint: string | null;
  status: string;
  matchCount: number;
  examples?: unknown;
};

export type CurrentRuleSnapshot = {
  slug: string;
  domain: string;
  layer: string;
  rule: string;
  pattern: string | null;
  action: string;
  severity: string;
  isActive: boolean;
};

type ExampleHit = {
  traceId?: string;
  promptRedacted?: string;
  prompt_redacted?: string;
  createdAt?: string;
  created_at?: string;
};

function asExamples(value: unknown): ExampleHit[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is ExampleHit => typeof v === "object" && v !== null);
}

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

// Suggestions is a monitoring/approval surface — design.md § 6 authorises
// functional color here. Severity reads as a tinted background + text
// weight gradient (LOG 400 → BLOCK 700) so it scans both with and
// without color recognition.
const ACTION_WEIGHT: Record<string, string> = {
  LOG: "font-normal",
  WARN: "font-medium",
  REDACT: "font-semibold",
  BLOCK: "font-bold",
};
const ACTION_INDICATOR: Record<string, string> = {
  LOG: "bg-zinc-500/70",
  WARN: "bg-orange-500/80",
  REDACT: "bg-amber-500/80",
  BLOCK: "bg-red-600/80",
};
const ACTION_TEXT: Record<string, string> = {
  LOG: "text-zinc-700",
  WARN: "text-orange-700",
  REDACT: "text-amber-700",
  BLOCK: "text-red-700",
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
  currentBySlug,
}: {
  initialSuggestions: Suggestion[];
  currentBySlug: Record<string, CurrentRuleSnapshot>;
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
          ...rows.filter((r) => r.sourceHint === "google_workspace"),
          ...rows.filter((r) => r.sourceHint !== "google_workspace"),
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
            className={`inline-flex items-center gap-2 font-mono text-xs ${
              runResult.ok && (runResult.inserted ?? 0) > 0
                ? "font-semibold text-ink"
                : runResult.ok
                  ? "text-graphite"
                  : "font-semibold text-ink"
            }`}
          >
            <span
              aria-hidden
              className={`h-3 w-1 ${
                runResult.ok && (runResult.inserted ?? 0) > 0
                  ? "bg-ink"
                  : runResult.ok
                    ? "bg-graphite"
                    : "bg-ink"
              }`}
            />
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
          <div
            className="flex flex-col items-start gap-2 border border-graphite-dark/15 bg-paper-soft/30 p-5"
            style={{ borderRadius: "var(--radius)" }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-graphite">
              // sin sugerencias pendientes
            </span>
            <p className="text-sm leading-relaxed text-graphite-dark">
              Cuando el AI Suggestor analice el tráfico — o cuando importes
              un Google Doc desde{" "}
              <a href="/admin/rules" className="text-ink underline underline-offset-4">
                reglas
              </a>
              {" "}— las propuestas aparecen acá para que decidas.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((s) => (
              <SuggestionCard
                key={s.id}
                s={s}
                current={currentBySlug[s.proposedSlug] ?? null}
                onDecide={decide}
              />
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
              <SuggestionCard
                key={s.id}
                s={s}
                current={currentBySlug[s.proposedSlug] ?? null}
                onDecide={decide}
                decided
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  s,
  current,
  onDecide,
  decided = false,
}: {
  s: Suggestion;
  current: CurrentRuleSnapshot | null;
  onDecide: (id: string, action: "accept" | "reject") => void;
  decided?: boolean;
}) {
  const examples = asExamples(s.examples).slice(0, 2);
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
          className={`border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${
            current
              ? "border-graphite-dark/30 text-graphite"
              : "border-ink text-ink"
          }`}
        >
          // {current ? "actualiza regla" : "regla nueva"}
        </span>

        <span
          className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider ${
            ACTION_TEXT[s.proposedAction] ?? "text-ink"
          }`}
        >
          <span
            aria-hidden
            className={`h-3.5 w-1 ${ACTION_INDICATOR[s.proposedAction] ?? "bg-graphite"}`}
          />
          <span className={ACTION_WEIGHT[s.proposedAction] ?? "font-normal"}>
            {s.proposedAction}
          </span>
        </span>

        <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-graphite">
          {s.status}
        </span>
      </div>

      {/* Side-by-side diff: visible only when there is an existing rule. */}
      {current ? (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <DiffPane
            label="// actual"
            domain={DOMAIN_LABELS[current.domain] ?? current.domain}
            layer={current.layer}
            action={current.action}
            severity={SEVERITY_LABELS[current.severity] ?? current.severity}
            rule={current.rule}
            faded
          />
          <DiffPane
            label="// propuesta"
            domain={DOMAIN_LABELS[s.proposedDomain] ?? s.proposedDomain}
            layer={s.proposedLayer ?? "—"}
            action={s.proposedAction}
            severity={SEVERITY_LABELS[s.proposedSeverity] ?? s.proposedSeverity}
            rule={s.proposedRule}
          />
        </div>
      ) : (
        <p className="mb-3 text-sm leading-relaxed text-graphite-dark">
          {s.proposedRule}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-graphite">
        <span>{DOMAIN_LABELS[s.proposedDomain] ?? s.proposedDomain}</span>
        <span>·</span>
        <span>
          severidad {SEVERITY_LABELS[s.proposedSeverity] ?? s.proposedSeverity}
        </span>
        {s.matchCount > 0 && (
          <>
            <span>·</span>
            <span className="font-semibold text-ink">
              {s.matchCount} matches retroactivos
            </span>
          </>
        )}
      </div>

      {examples.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-graphite-dark/15 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-graphite">
            // ejemplos · matchearían
          </span>
          {examples.map((ex, i) => {
            const text = ex.promptRedacted ?? ex.prompt_redacted ?? "";
            return (
              <p
                key={(ex.traceId ?? "") + i}
                className="break-words bg-paper-soft/40 p-2 font-mono text-[11px] leading-relaxed text-ink"
              >
                {text.length > 140 ? `${text.slice(0, 137)}…` : text}
              </p>
            );
          })}
        </div>
      )}

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

function DiffPane({
  label,
  domain,
  layer,
  action,
  severity,
  rule,
  faded = false,
}: {
  label: string;
  domain: string;
  layer: string;
  action: string;
  severity: string;
  rule: string;
  faded?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 border p-3 ${
        faded
          ? "border-graphite-dark/15 bg-paper-soft/30 text-graphite-dark"
          : "border-graphite-dark/30 bg-paper text-ink"
      }`}
      style={{ borderRadius: "var(--radius)" }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-graphite">
        {label}
      </span>
      <p className="text-sm leading-relaxed">{rule}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-graphite">
        <span
          className={`inline-flex items-center gap-1.5 ${
            ACTION_TEXT[action] ?? "text-ink"
          }`}
        >
          <span
            aria-hidden
            className={`h-3 w-1 ${ACTION_INDICATOR[action] ?? "bg-graphite"}`}
          />
          <span className={ACTION_WEIGHT[action] ?? "font-normal"}>
            {action}
          </span>
        </span>
        <span>· {layer}</span>
        <span>· {domain}</span>
        <span>· sev {severity}</span>
      </div>
    </div>
  );
}
