"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useEffect, useRef, useState } from "react";
import type { EventDTO } from "@/lib/events";

const POLL_MS = 3000;
const ACTIONS = ["BLOCK", "REDACT", "WARN", "LOG"] as const;

const ACTION_STYLES: Record<EventDTO["action"], string> = {
  BLOCK: "bg-red-500/10 text-red-700",
  REDACT: "bg-amber-500/10 text-amber-700",
  WARN: "bg-orange-500/10 text-orange-700",
  LOG: "bg-zinc-500/10 text-zinc-700",
};

export function EventsFeed({ initialEvents }: { initialEvents: EventDTO[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState<"" | EventDTO["action"]>("");
  const [paused, setPaused] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const newestRef = useRef<string | null>(initialEvents[0]?.createdAt ?? null);

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const params = new URLSearchParams();
        if (newestRef.current) params.set("since", newestRef.current);
        const res = await fetch(`/api/admin/events?${params}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { events: EventDTO[] };
        if (cancelled) return;
        setLastPoll(new Date());
        if (data.events.length === 0) return;
        // Backend devuelve más recientes primero — el más nuevo es events[0].
        newestRef.current = data.events[0].createdAt;
        setEvents((prev) => {
          const seen = new Set(prev.map((e) => e.id));
          const fresh = data.events.filter((e) => !seen.has(e.id));
          return [...fresh, ...prev].slice(0, 200);
        });
      } catch {
        // El polling silencioso: si falla un tick lo retomamos en el próximo.
      }
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [paused]);

  const visible = filter ? events.filter((e) => e.action === filter) : events;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FilterChip
            active={filter === ""}
            onClick={() => setFilter("")}
            label={`todos · ${events.length}`}
          />
          {ACTIONS.map((a) => (
            <FilterChip
              key={a}
              active={filter === a}
              onClick={() => setFilter(a)}
              label={`${a} · ${events.filter((e) => e.action === a).length}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-graphite">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="border border-graphite-dark/30 px-2 py-1 transition-colors hover:border-ink hover:text-ink"
            style={{ borderRadius: "var(--radius)" }}
          >
            {paused ? "reanudar" : "pausar"}
          </button>
          <span>
            //{" "}
            {paused
              ? "polling en pausa"
              : lastPoll
                ? `último poll · ${formatTime(lastPoll)}`
                : "esperando primer poll"}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        {visible.length === 0 ? (
          <div
            className="border border-graphite-dark/20 px-6 py-14 text-center font-mono text-xs text-graphite"
            style={{ borderRadius: "var(--radius)" }}
          >
            // sin eventos. mandá un request al proxy y va a aparecer acá.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((e) => (
              <li
                key={e.id}
                className="border border-graphite-dark/15 bg-paper p-4"
                style={{ borderRadius: "var(--radius)" }}
              >
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-graphite">
                  <span
                    className={`px-2 py-1 font-semibold ${ACTION_STYLES[e.action]}`}
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {e.action}
                  </span>
                  <span suppressHydrationWarning>// {formatTime(new Date(e.createdAt))}</span>
                  <span>// {e.latencyTotalMs}ms</span>
                  <span className="truncate">// trace · {e.traceId.slice(0, 12)}…</span>
                  {e.upstreamStatus !== null ? (
                    <span>// upstream · {e.upstreamStatus}</span>
                  ) : (
                    <span>// upstream · skipped</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-ink">{e.reason}</p>
                {e.policyHits.length > 0 ? (
                  <p className="mt-2 font-mono text-[11px] text-graphite">
                    // hits ·{" "}
                    {e.policyHits.map((h) => `${h.layer}/${h.slug}`).join(" · ")}
                  </p>
                ) : null}
                <pre className="mt-3 max-h-32 overflow-hidden whitespace-pre-wrap break-words bg-paper-soft/40 p-3 font-mono text-[11px] leading-relaxed text-graphite-dark">
                  {truncate(e.prompt, 280)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? "bg-ink text-paper"
          : "border border-graphite-dark/25 text-graphite hover:border-ink hover:text-ink"
      }`}
      style={{ borderRadius: "var(--radius)" }}
    >
      {label}
    </button>
  );
}

function formatTime(d: Date): string {
  // 24h fijo para evitar el narrow no-break space que ICU mete antes del a.m./p.m.
  // y que difiere entre Node y el browser → hydration mismatch.
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}
