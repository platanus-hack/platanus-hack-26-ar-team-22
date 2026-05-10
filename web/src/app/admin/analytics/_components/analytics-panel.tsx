"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Sparkline } from "@/components/ui";

type ActionStats = { count: number; avgLatencyMs: number };
type AnalyticsData = {
  range: string;
  total: number;
  avgLatencyMs: number;
  byAction: {
    BLOCK: ActionStats;
    REDACT: ActionStats;
    WARN: ActionStats;
    LOG: ActionStats;
  };
  hourly: { hour: string; count: number }[];
  topPolicies: { slug: string; count: number }[];
};

type Range = "24h" | "7d" | "30d";

const RANGE_LABELS: Record<Range, string> = {
  "24h": "últimas 24 h",
  "7d": "últimos 7 días",
  "30d": "últimos 30 días",
};

// Analytics is a monitoring surface — design.md § 6 explicitly authorises
// functional color here so the compliance officer can scan BLOCK vs WARN
// at a glance. Weight is layered on top so the hierarchy holds even for
// readers who can't tell the colors apart.
const ACTION_STYLES: Record<string, { bar: string; text: string }> = {
  BLOCK:  { bar: "bg-red-600/85",   text: "font-bold text-red-700" },
  REDACT: { bar: "bg-amber-500/85", text: "font-semibold text-amber-700" },
  WARN:   { bar: "bg-orange-400/85", text: "font-medium text-orange-700" },
  LOG:    { bar: "bg-zinc-400/85",  text: "text-zinc-600" },
};

type AlignmentLevel = "alto" | "moderado" | "bajo" | "crítico";

function getAlignmentLevel(score: number): AlignmentLevel {
  if (score >= 90) return "alto";
  if (score >= 70) return "moderado";
  if (score >= 50) return "bajo";
  return "crítico";
}

const ALIGNMENT_META: Record<
  AlignmentLevel,
  { label: string; description: string; weight: string; tone: string }
> = {
  alto:     { label: "alineamiento alto",     description: "Los devs operan dentro de las políticas de la organización.",         weight: "font-medium",  tone: "text-ink" },
  moderado: { label: "alineamiento moderado", description: "Hay margen de mejora — revisá las políticas más activadas.",          weight: "font-semibold", tone: "text-ink" },
  bajo:     { label: "alineamiento bajo",     description: "Un porcentaje significativo de requests está siendo bloqueado.",       weight: "font-bold",     tone: "text-amber-700" },
  crítico:  { label: "atención requerida",    description: "Más de la mitad de los requests no pasan las políticas vigentes.",    weight: "font-bold",     tone: "text-red-700" },
};

export function AnalyticsPanel({ initial }: { initial: AnalyticsData }) {
  const [data, setData] = useState(initial);
  const [range, setRange] = useState<Range>("7d");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(range); }, [range, load]);

  const blocked = data.byAction.BLOCK.count;
  const aligned = data.total - blocked;
  const alignmentScore = data.total > 0 ? (aligned / data.total) * 100 : null;
  const level = alignmentScore !== null ? getAlignmentLevel(alignmentScore) : null;
  const meta = level ? ALIGNMENT_META[level] : null;
  const maxAction = Math.max(...Object.values(data.byAction).map((a) => a.count), 1);

  return (
    <div className={`flex flex-col gap-8 transition-opacity ${loading ? "opacity-50" : ""}`}>

      {/* Range selector */}
      <div className="flex items-center gap-2">
        {(["24h", "7d", "30d"] as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              range === r
                ? "bg-ink text-paper"
                : "border border-graphite-dark/25 text-graphite hover:border-ink hover:text-ink"
            }`}
            style={{ borderRadius: "var(--radius)" }}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Alignment hero */}
      <div
        className="border border-graphite-dark/15 bg-paper p-6 sm:p-8"
        style={{ borderRadius: "var(--radius)" }}
      >
        <p className="mb-6 font-mono text-[11px] uppercase tracking-wider text-graphite">
          // alineamiento organizacional
        </p>

        {alignmentScore !== null && meta ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <span className="text-6xl font-semibold leading-none tracking-tighter text-ink sm:text-7xl md:text-8xl">
                {alignmentScore.toFixed(1)}
                <span className="text-3xl sm:text-4xl md:text-5xl">%</span>
              </span>
              <div className="flex flex-col gap-1 pb-1">
                <span
                  className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest ${meta.weight} ${meta.tone}`}
                >
                  <span
                    aria-hidden
                    className={`h-3 w-1 ${
                      level === "alto"
                        ? "bg-graphite"
                        : level === "moderado"
                          ? "bg-graphite-dark"
                          : level === "bajo"
                            ? "bg-amber-600"
                            : "bg-red-600"
                    }`}
                  />
                  {meta.label}
                </span>
                <span className="max-w-xs font-mono text-[11px] text-graphite">
                  {meta.description}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex flex-col gap-2">
              <div className="relative h-2 w-full bg-paper-soft" style={{ borderRadius: "2px" }}>
                <div
                  className="absolute inset-y-0 left-0 bg-ink transition-all duration-700"
                  style={{ width: `${alignmentScore}%`, borderRadius: "2px" }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-graphite">
                <span>{aligned.toLocaleString("es-AR")} de {data.total.toLocaleString("es-AR")} requests alineados</span>
                <span>{blocked.toLocaleString("es-AR")} bloqueados</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center font-mono text-xs text-graphite">
            // sin datos suficientes para calcular alineamiento
          </p>
        )}
      </div>

      {/* Hourly volume — gives the eye a "today vs. earlier" before drilling in */}
      <HourlyVolume hourly={data.hourly} />

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="total requests" value={data.total.toLocaleString("es-AR")} />
        <KpiCard label="bloqueados" value={blocked.toLocaleString("es-AR")} />
        <KpiCard
          label="block rate"
          value={data.total > 0 ? `${((blocked / data.total) * 100).toFixed(1)}%` : "—"}
        />
        <KpiCard label="latencia prom." value={data.avgLatencyMs > 0 ? `${data.avgLatencyMs} ms` : "—"} />
      </div>

      {/* Action breakdown */}
      <div
        className="border border-graphite-dark/15 bg-paper p-5"
        style={{ borderRadius: "var(--radius)" }}
      >
        <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-graphite">
          // acción · distribución
        </p>
        <div className="flex flex-col gap-3">
          {(["BLOCK", "REDACT", "WARN", "LOG"] as const).map((action) => {
            const stats = data.byAction[action];
            const pct = (stats.count / maxAction) * 100;
            const style = ACTION_STYLES[action];
            const filterable = stats.count > 0;
            const row = (
              <div className="flex items-center gap-3">
                <span
                  className={`w-14 font-mono text-[11px] uppercase ${style.text}`}
                >
                  {action}
                </span>
                <div
                  className="relative h-2 flex-1 bg-paper-soft/60"
                  style={{ borderRadius: "2px" }}
                >
                  <div
                    className={`absolute inset-y-0 left-0 ${style.bar} transition-all duration-500`}
                    style={{ width: `${pct}%`, borderRadius: "2px" }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-[11px] text-graphite">
                  {stats.count.toLocaleString("es-AR")}
                </span>
                <span className="hidden w-20 text-right font-mono text-[11px] text-graphite sm:block">
                  ~{stats.avgLatencyMs} ms
                </span>
                <span
                  aria-hidden
                  className={`hidden font-mono text-[11px] sm:inline ${
                    filterable ? "text-graphite" : "text-transparent"
                  }`}
                >
                  →
                </span>
              </div>
            );
            return filterable ? (
              <Link
                key={action}
                href={`/admin/events?action=${action}`}
                className="-mx-2 rounded px-2 py-1 transition-colors hover:bg-paper-soft/60"
                title={`ver eventos · ${action}`}
              >
                {row}
              </Link>
            ) : (
              <div key={action} className="px-2 py-1">
                {row}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top policies */}
      {data.topPolicies.length > 0 && (
        <div
          className="border border-graphite-dark/15 bg-paper p-5"
          style={{ borderRadius: "var(--radius)" }}
        >
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-graphite">
            // políticas · más activadas
          </p>
          <div className="flex flex-col gap-2">
            {data.topPolicies.map((p, i) => {
              const pct = (p.count / data.topPolicies[0].count) * 100;
              return (
                <div key={p.slug} className="flex items-center gap-3">
                  <span className="w-4 font-mono text-[11px] text-graphite">{i + 1}</span>
                  <span className="w-48 truncate font-mono text-[11px] text-ink">{p.slug}</span>
                  <div className="relative h-1.5 flex-1 bg-paper-soft/60" style={{ borderRadius: "2px" }}>
                    <div
                      className="absolute inset-y-0 left-0 bg-ink/50 transition-all duration-500"
                      style={{ width: `${pct}%`, borderRadius: "2px" }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-[11px] text-graphite">
                    {p.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 border border-graphite-dark/15 bg-paper p-4"
      style={{ borderRadius: "var(--radius)" }}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider text-graphite">
        // {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight text-ink">
        {value}
      </span>
    </div>
  );
}

function HourlyVolume({
  hourly,
}: {
  hourly: { hour: string; count: number }[];
}) {
  // Normalise to a fixed number of buckets so the chart doesn't squash
  // wildly when the range changes. We pad zeros at the start.
  const buckets = useMemo(() => {
    const values = hourly.map((h) => h.count);
    return values;
  }, [hourly]);
  const total = buckets.reduce((a, b) => a + b, 0);
  const peak = buckets.length > 0 ? Math.max(...buckets) : 0;
  return (
    <div
      className="flex flex-col gap-3 border border-graphite-dark/15 bg-paper p-5"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
          // volumen por hora
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
          {total.toLocaleString("es-AR")} requests · pico {peak} / hora
        </span>
      </div>
      <Sparkline values={buckets} variant="bars" height={36} className="text-ink" />
    </div>
  );
}
