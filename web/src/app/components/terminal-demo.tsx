"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const LIVE_ACCENT = "#35d07f";

type EntryType = "LOG" | "REDACT" | "BLOCK";
type TokenTone =
  | "comment"
  | "keyword"
  | "function"
  | "variable"
  | "string"
  | "number"
  | "operator"
  | "property";

interface CodeToken {
  text: string;
  tone: TokenTone;
}

interface LogEntry {
  type: EntryType;
  event: string;
  detail: string;
  ms: string;
  status: string;
  code: CodeToken[];
}

const TERMINAL_STEPS: LogEntry[] = [
  {
    type: "LOG",
    event: "request.scan.started",
    detail: "Claude Code outbound payload registered",
    ms: "2ms",
    status: "capturando request",
    code: [
      { text: "proxy", tone: "function" },
      { text: ".", tone: "operator" },
      { text: "log", tone: "function" },
      { text: "(", tone: "operator" },
      { text: "{ ", tone: "operator" },
      { text: "session", tone: "property" },
      { text: ": ", tone: "operator" },
      { text: '"cx_9f2a"', tone: "string" },
      { text: ", ", tone: "operator" },
      { text: "rules", tone: "property" },
      { text: ": ", tone: "operator" },
      { text: "12", tone: "number" },
      { text: " }", tone: "operator" },
      { text: ")", tone: "operator" },
    ],
  },
  {
    type: "REDACT",
    event: "pii.email.detected",
    detail: '"facu@corp.com" → "[REDACTED_EMAIL]"',
    ms: "44ms",
    status: "redactando PII",
    code: [
      { text: "payload", tone: "variable" },
      { text: ".", tone: "operator" },
      { text: "email", tone: "property" },
      { text: " = ", tone: "operator" },
      { text: "redact", tone: "function" },
      { text: "(", tone: "operator" },
      { text: '"facu@corp.com"', tone: "string" },
      { text: ")", tone: "operator" },
      { text: " // pii.email", tone: "comment" },
    ],
  },
  {
    type: "BLOCK",
    event: "credential.token.blocked",
    detail: "secret key matched policy · response 403",
    ms: "7ms",
    status: "cortando salida",
    code: [
      { text: "throw", tone: "keyword" },
      { text: " ", tone: "operator" },
      { text: "block", tone: "function" },
      { text: "(", tone: "operator" },
      { text: '"POLICY_CREDENTIAL_LEAK"', tone: "string" },
      { text: ", ", tone: "operator" },
      { text: "403", tone: "number" },
      { text: ")", tone: "operator" },
    ],
  },
];

const TYPE_COLOR: Record<EntryType, string> = {
  LOG:    "#4fc1ff",
  REDACT: "#d7ba7d",
  BLOCK:  "#f44747",
};

const TYPE_LABEL_COLOR: Record<EntryType, string> = {
  LOG:    "#75beff",
  REDACT: "#dcdcaa",
  BLOCK:  "#ff6b6b",
};

const TYPE_BG: Record<EntryType, string> = {
  LOG:    "rgba(79, 193, 255, 0.045)",
  REDACT: "rgba(215, 186, 125, 0.065)",
  BLOCK:  "rgba(244, 71, 71, 0.07)",
};

const TOKEN_COLOR: Record<TokenTone, string> = {
  comment:  "#6a9955",
  keyword:  "#569cd6",
  function: "#dcdcaa",
  variable: "#9cdcfe",
  string:   "#ce9178",
  number:   "#b5cea8",
  operator: "#d4d4d4",
  property: "#9cdcfe",
};

function codeLength(tokens: CodeToken[]) {
  return tokens.reduce((total, token) => total + token.text.length, 0);
}

export default function TerminalDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [visibleEntries, setVisibleEntries] = useState<LogEntry[]>([]);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView || hasStartedRef.current) return;
    hasStartedRef.current = true;

    let cancelled = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 0));
      if (cancelled) return;

      setStarted(true);
      await new Promise((r) => setTimeout(r, 350));

      for (const entry of TERMINAL_STEPS) {
        if (cancelled) return;
        setVisibleEntries((prev) => [...prev, entry]);
        await new Promise((r) => setTimeout(r, entry.type === "LOG" ? 1250 : 1450));
      }

      if (!cancelled) {
        await new Promise((r) => setTimeout(r, 400));
        if (!cancelled) setDone(true);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [inView]);

  const activeEntry = visibleEntries.at(-1);

  return (
    <section id="terminal" className="py-24 md:py-32 border-t border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-start">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex flex-col gap-6 lg:pt-2"
          >
            <p className="font-mono text-[10px] text-white/25 tracking-[0.18em] uppercase">
              {"// TERMINAL DEL PROXY"}
            </p>
            <h2
              className="font-sans font-bold text-white leading-[1.1] tracking-[-0.025em]"
              style={{ fontSize: "clamp(26px, 3vw, 40px)" }}
            >
              Intercepción en Tiempo Real
            </h2>
            <p className="font-sans text-[#777] text-[14px] leading-[1.75] max-w-[380px]">
              Cada solicitud saliente de Claude Code pasa por el motor de políticas de Tranquera antes de alcanzar cualquier API externa.
            </p>

            <div className="flex flex-col gap-2.5 mt-1">
              {[
                { type: "LOG",    desc: "Solicitud registrada, sin acción" },
                { type: "REDACT", desc: "Dato sensible detectado y eliminado" },
                { type: "BLOCK",  desc: "Solicitud bloqueada por política" },
              ].map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                  <div
                    className="w-[2px] h-4 shrink-0"
                    style={{ backgroundColor: TYPE_LABEL_COLOR[item.type as EntryType] }}
                  />
                  <span
                    className="font-mono text-[10px] tracking-[0.1em] w-[48px] shrink-0"
                    style={{ color: TYPE_LABEL_COLOR[item.type as EntryType] }}
                  >
                    {item.type}
                  </span>
                  <span className="font-mono text-[10px] text-white/25">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <a
                href="#waitlist"
                className="inline-block font-mono text-[12px] text-[#888] border border-white/[0.12] px-5 py-2.5 hover:border-white/25 hover:text-white transition-all tracking-[0.04em]"
              >
                Configurar reglas
              </a>
            </div>
          </motion.div>

          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="border border-white/[0.09] overflow-hidden bg-[#0b0f14] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_28px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-[#11161d]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-white/35">proxy.guard.ts</span>
                <span className="font-mono text-[10px] text-white/12">·</span>
                <span className="font-mono text-[10px] text-white/25">
                  tail -f /var/log/tranquera/proxy
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3 bg-white/[0.08]" />
                <span className="font-mono text-[9px] pl-1" style={{ color: LIVE_ACCENT }}>
                  LIVE
                </span>
                <motion.div
                  className="w-1.5 h-1.5 rounded-full ml-0.5"
                  style={{
                    backgroundColor: LIVE_ACCENT,
                    boxShadow: `0 0 12px ${LIVE_ACCENT}`,
                  }}
                  animate={done ? { opacity: 0.7, scale: 1 } : { opacity: [1, 0.35, 1], scale: [1, 1.35, 1] }}
                  transition={{ repeat: done ? 0 : Infinity, duration: 1.25 }}
                />
              </div>
            </div>

            <div className="relative min-h-[330px] overflow-hidden bg-[#1e1e1e] p-4 font-mono text-[11px]">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.22]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
                  backgroundSize: "100% 28px",
                }}
              />

              <div className="relative flex flex-col gap-2">
                {visibleEntries.map((entry, i) => {
                  const isActive = !done && i === visibleEntries.length - 1;

                  return (
                    <motion.div
                      key={`${entry.type}-${entry.event}`}
                      initial={{ opacity: 0, y: 10, scale: 0.992 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.28, ease: EASE }}
                      className="relative overflow-hidden border border-white/[0.07] bg-[#252526]/85 px-3 py-3"
                      style={{ boxShadow: isActive ? `0 0 0 1px ${TYPE_COLOR[entry.type]}33` : undefined }}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute inset-y-0 left-0 w-1/2"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${TYPE_COLOR[entry.type]}1f, transparent)`,
                          }}
                          initial={{ x: "-120%" }}
                          animate={{ x: "240%" }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                        />
                      )}

                      <div className="relative flex items-start gap-3">
                        <div
                          className="mt-[3px] h-[38px] w-[2px] shrink-0 rounded-full"
                          style={{ backgroundColor: TYPE_COLOR[entry.type] }}
                        />

                        <span className="w-[18px] shrink-0 pt-[1px] text-right text-white/[0.18]">
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span
                              className="w-[58px] shrink-0 text-[10px] tracking-[0.08em]"
                              style={{ color: TYPE_LABEL_COLOR[entry.type] }}
                            >
                              {entry.type}
                            </span>
                            <span className="text-[#d4d4d4]">{entry.event}</span>
                            <span className="text-white/20">·</span>
                            <span className="text-white/40">{entry.detail}</span>
                            <span className="ml-auto text-white/20">{entry.ms}</span>
                          </div>

                          <div
                            className="rounded-sm border px-3 py-2"
                            style={{
                              backgroundColor: TYPE_BG[entry.type],
                              borderColor: `${TYPE_COLOR[entry.type]}26`,
                            }}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="shrink-0 text-[#808080]">$</span>
                              <motion.code
                                className="block overflow-hidden whitespace-nowrap leading-5"
                                initial={{ width: 0 }}
                                animate={{ width: `${codeLength(entry.code)}ch` }}
                                transition={{ duration: 0.78, ease: "linear" }}
                              >
                                {entry.code.map((token, tokenIndex) => (
                                  <span
                                    key={`${entry.event}-${tokenIndex}`}
                                    style={{ color: TOKEN_COLOR[token.tone] }}
                                  >
                                    {token.text}
                                  </span>
                                ))}
                              </motion.code>
                              {isActive && (
                                <motion.span
                                  className="h-4 w-[7px] shrink-0 bg-[#d4d4d4]"
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ repeat: Infinity, duration: 0.8 }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {started && (
                  <div className="flex items-center gap-3 px-2 pt-1 text-white/[0.28]">
                    <span className="w-[2px]" />
                    <span className="w-[18px] text-right">
                      {String(visibleEntries.length + 1).padStart(2, "0")}
                    </span>
                    <span className="w-[58px] text-[10px] tracking-[0.08em]">
                      {done ? "IDLE" : "RUN"}
                    </span>
                    <span className="text-white/30">
                      {done ? "policy trace complete" : activeEntry?.status ?? "iniciando proxy"}
                    </span>
                    {!done && (
                      <motion.span
                        className="ml-1 inline-block h-[11px] w-[7px] bg-white/35"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
