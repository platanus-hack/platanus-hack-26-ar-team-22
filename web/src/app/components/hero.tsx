"use client";

import { motion } from "framer-motion";
import NetworkBackground from "./network-background";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

const metrics = [
  { value: "<12ms", label: "Latencia de bloqueo", id: "SYS_LAT" },
  { value: "100%",  label: "Registro auditable",  id: "AUD_COV" },
  { value: "0",     label: "Falsos positivos",     id: "FP_RATE" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <NetworkBackground />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 20% 50%, transparent 0%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-36 pb-24 w-full">
        <motion.div variants={stagger} initial="initial" animate="animate">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-white/20" />
            <p className="font-mono text-[11px] text-white/35 tracking-[0.18em] uppercase">
              Firewall corporativo para Claude Code
            </p>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display font-bold text-white tracking-[-0.04em] leading-[1.02] mb-7 max-w-[840px]"
            style={{ fontSize: "clamp(36px, 5.8vw, 80px)" }}
          >
            Un paso controlado<br className="hidden md:block" /> entre la intención<br className="hidden md:block" /> y la respuesta.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-mono text-[#777] leading-[1.7] mb-11 max-w-[520px]"
            style={{ fontSize: "clamp(13px, 1.1vw, 16px)" }}
          >
            Tranquera intercepta lo que Claude Code intenta enviar al exterior, detecta datos sensibles, aplica políticas corporativas y registra cada decisión para auditoría.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-20">
            <a
              href="#waitlist"
              className="btn-press font-mono text-[12px] text-black bg-white px-5 py-2.5 hover:bg-[#e8e8e8] active:bg-[#d8d8d8] transition-all tracking-[0.05em] inline-flex items-center gap-2 group"
            >
              Inicializar protocolo
              <svg
                width="10" height="8" viewBox="0 0 10 8" fill="none"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M0 4h8M5 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="font-mono text-[12px] text-[#777] border border-white/[0.12] px-5 py-2.5 hover:border-white/25 hover:text-[#ccc] transition-all tracking-[0.05em]"
            >
              Ver documentación
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="grid grid-cols-3 gap-0 border-t border-white/[0.07] pt-8 max-w-[520px]"
          >
            {metrics.map((m, i) => (
              <div
                key={m.id}
                className={`flex flex-col gap-2 pr-6 ${i > 0 ? "pl-6 border-l border-white/[0.07]" : ""}`}
              >
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="w-1 h-1 rounded-full bg-white/25"
                    animate={{ opacity: [0.25, 0.6, 0.25] }}
                    transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.8 }}
                  />
                  <span className="font-mono text-[9px] text-white/20 tracking-[0.15em] uppercase">
                    {m.id}
                  </span>
                </div>
                <span
                  className="font-display font-bold text-white tracking-[-0.03em] leading-none"
                  style={{ fontSize: "clamp(20px, 2.2vw, 28px)" }}
                >
                  {m.value}
                </span>
                <span className="font-mono text-[10px] text-[#444] tracking-[0.08em] uppercase leading-tight">
                  {m.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect x="1" y="1" width="12" height="18" rx="6" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <motion.rect
              x="6" y="4" width="2" height="4" rx="1" fill="rgba(255,255,255,0.25)"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
