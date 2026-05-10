// TraceSection animation: request card slides in from the left, a connector
// scan-line travels across, then the synthetic-response card emerges on the
// right. On narrow screens the connector flips vertical and the cards stack.
/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { KvLine } from "@/components/ui";

const EASE = [0.16, 1, 0.3, 1] as const;

const leftSlide = {
  hidden: { opacity: 0, x: -32, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE },
  },
};

const rightSlide = {
  hidden: { opacity: 0, x: 32, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE, delay: 0.45 },
  },
};

export function TraceDemo() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once: true, amount: 0.3 }}
      className="relative grid gap-6 lg:grid-cols-[1fr_64px_1fr]"
    >
      <motion.div variants={leftSlide}>
        <TraceCard label="// request entrante" theme="light">
          <KvLine k="POST" v="/v1/messages" />
          <KvLine k="x-api-key" v="sk-ant-…" />
          <KvLine k="anthropic-version" v="2023-06-01" />
          <pre className="mt-4 break-words bg-paper-soft/60 p-3 font-mono text-xs leading-relaxed text-ink">
            {`{ "model": "claude-sonnet-4-6",
  "messages": [{
    "role": "user",
    "content": "ayudame con AKIAIOSFODNN7EXAMPLE"
  }] }`}
          </pre>
        </TraceCard>
      </motion.div>

      <Connector reduce={!!reduce} />

      <motion.div variants={rightSlide}>
        <TraceCard label="// respuesta sintética · BLOCK" theme="dark">
          <KvLine k="x-team22-trace-id" v="01HXYZK…" dark />
          <KvLine k="x-team22-action" v="BLOCK" dark />
          <KvLine k="stop_reason" v="team22_blocked" dark />
          <div className="mt-4 break-words border border-graphite-dark p-3 font-mono text-xs leading-relaxed text-paper">
            Tu prompt se alejó de la política{" "}
            <span className="text-paper underline underline-offset-2">
              aws-access-key
            </span>
            : detectamos un patrón de AWS Secret Access Key. Para trabajar con
            credenciales reales dentro del marco de la org, abrí un ticket con
            tu admin.
          </div>
          <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-graphite">
            <span>// total · 9ms</span>
            <span className="hairline h-3 w-px" />
            <span>// upstream · skipped</span>
          </div>
        </TraceCard>
      </motion.div>
    </motion.div>
  );
}

function TraceCard({
  label,
  theme,
  children,
}: {
  label: string;
  theme: "light" | "dark";
  children: ReactNode;
}) {
  const base =
    theme === "dark"
      ? "bg-ink text-paper border border-graphite-dark"
      : "bg-paper text-ink border border-graphite-dark/20";
  return (
    <article
      className={`flex h-full flex-col gap-4 p-6 md:p-8 ${base}`}
      style={{ borderRadius: "var(--radius)" }}
    >
      <span className="font-mono text-xs uppercase tracking-wider text-graphite">
        {label}
      </span>
      <div className="flex flex-col gap-2">{children}</div>
    </article>
  );
}

function Connector({ reduce }: { reduce: boolean }) {
  // Horizontal on lg+, vertical on small. The scan-line is a 30%-wide
  // gradient swept across the line via stroke-dashoffset.
  return (
    <div
      aria-hidden
      className="pointer-events-none relative flex items-center justify-center"
    >
      {/* Horizontal track — desktop */}
      <svg
        className="hidden h-3 w-full lg:block"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          x2="100"
          y1="6"
          y2="6"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="1"
          className="text-ink"
        />
        {!reduce ? (
          <motion.line
            x1="0"
            x2="100"
            y1="6"
            y2="6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="text-ink"
            strokeDasharray="20 80"
            initial={{ strokeDashoffset: 100 }}
            whileInView={{ strokeDashoffset: -100 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
          />
        ) : null}
        <polyline
          points="92,2 96,6 92,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink"
          opacity="0.7"
        />
      </svg>

      {/* Vertical track — mobile */}
      <svg
        className="block h-12 w-3 lg:hidden"
        viewBox="0 0 12 100"
        preserveAspectRatio="none"
      >
        <line
          x1="6"
          x2="6"
          y1="0"
          y2="100"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="1"
          className="text-ink"
        />
        {!reduce ? (
          <motion.line
            x1="6"
            x2="6"
            y1="0"
            y2="100"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="text-ink"
            strokeDasharray="20 80"
            initial={{ strokeDashoffset: 100 }}
            whileInView={{ strokeDashoffset: -100 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
          />
        ) : null}
        <polyline
          points="2,92 6,96 10,92"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
