"use client";

import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const steps = [
  {
    index: "01",
    tag: "REQUEST",
    title: "Claude Code envía",
    description:
      "Una instrucción, una consulta, un contexto con datos sensibles. El proxy es transparente — el cliente no necesita saber que existe.",
    proof: "Proxy transparente · sin cambios en el cliente",
    diagram: (
      <div className="font-mono text-[10px] leading-[1.9] select-none">
        <span className="text-white/40">claude-code</span>
        <span className="text-white/15"> ──── HTTPS ────► </span>
        <span className="text-white/40">proxy:8443</span>
        <br />
        <span className="text-white/12">{"                      [intercepting]"}</span>
      </div>
    ),
  },
  {
    index: "02",
    tag: "INTERCEPT",
    title: "Tranquera evalúa",
    description:
      "Intercepta cada request y la evalúa en tiempo real contra reglas corporativas: identidad, contenido, destino y contexto.",
    proof: "Identidad · contenido · destino · contexto",
    diagram: (
      <div className="font-mono text-[10px] leading-[1.9] select-none">
        <span className="text-white/30">policy.engine</span>
        <span className="text-white/15">.evaluate(req)</span>
        <br />
        <span className="text-white/20">{"  rule_pii   "}</span>
        <span className="text-white/12">── scan ── </span>
        <span className="text-white/30">●</span>
        <br />
        <span className="text-white/20">{"  rule_creds "}</span>
        <span className="text-white/12">── scan ── </span>
        <span className="text-white/30">●</span>
      </div>
    ),
  },
  {
    index: "03",
    tag: "RESOLVE",
    title: "Pasa, redacta o bloquea",
    description:
      "Limpio: pasa. PII: redacta antes de enviar. Credencial: bloquea con 403. Todo en un log append-only listo para auditoría.",
    proof: "append-only · tamper-proof · audit-ready",
    diagram: (
      <div className="font-mono text-[10px] leading-[1.9] select-none">
        <span className="text-white/15">{"req ─┬── "}</span>
        <span className="text-white/35">PASS</span>
        <span className="text-white/12">  ──► api.anthropic.com</span>
        <br />
        <span className="text-white/15">{"     ├── "}</span>
        <span className="text-[#ffbf00]/50">REDACT</span>
        <span className="text-white/12"> ──► sanitize → api</span>
        <br />
        <span className="text-white/15">{"     └── "}</span>
        <span className="text-[#dc143c]/60">BLOCK</span>
        <span className="text-white/12">  ──► 403 + audit</span>
      </div>
    ),
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-36 border-t border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16"
        >
          <div>
            <p className="font-mono text-[10px] text-white/20 tracking-[0.18em] uppercase mb-4">
              // CÓMO FUNCIONA
            </p>
            <h2
              className="font-display font-bold text-white tracking-[-0.04em] leading-[1.06]"
              style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
            >
              Tres momentos.<br />Un paso invisible.
            </h2>
          </div>
          <p className="font-mono text-[10px] text-white/18 md:text-right max-w-[180px] leading-relaxed">
            Latencia media de<br />intercepción: 8ms
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06]"
        >
          {steps.map((step) => (
            <motion.div
              key={step.index}
              variants={itemVariants}
              className="bg-black flex flex-col hover-lift group cursor-default relative overflow-hidden"
            >
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/[0.12] pointer-events-none transition-all duration-300 group-hover:border-white/25" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/[0.07] pointer-events-none transition-all duration-300 group-hover:border-white/18" />

              <div className="px-7 pt-7 pb-5 border-b border-white/[0.05] min-h-[80px] flex items-end">
                {step.diagram}
              </div>

              <div className="px-7 pt-5 pb-7 flex flex-col gap-3.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-white/20 tracking-[0.06em]">
                    {step.index}
                  </span>
                  <span className="font-mono text-[9px] text-white/12 tracking-[0.18em] uppercase px-1.5 py-0.5 border border-white/[0.06]">
                    {step.tag}
                  </span>
                </div>

                <h3
                  className="font-display font-semibold text-white tracking-[-0.02em] leading-[1.25]"
                  style={{ fontSize: "clamp(17px, 1.4vw, 20px)" }}
                >
                  {step.title}
                </h3>

                <p className="font-mono text-[#5a5a5a] text-[12px] leading-[1.8] flex-1">
                  {step.description}
                </p>

                <div className="pt-4 border-t border-white/[0.05] flex items-center gap-2">
                  <div className="w-1 h-3 bg-white/15 shrink-0" />
                  <p className="font-mono text-[10px] text-white/18 tracking-[0.04em]">
                    {step.proof}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
