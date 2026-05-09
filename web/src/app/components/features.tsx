"use client";

import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const features = [
  {
    index: "01",
    tag: "PRECISO",
    title: "Infraestructura Auditable",
    description:
      "Reglas granulares basadas en identidad y contexto. Cada regla tiene ID único, versión y log de cambios. Sin falsos positivos.",
    proof: "Reglas versionadas por ID y prioridad.",
  },
  {
    index: "02",
    tag: "SILENCIOSO",
    title: "Operación No Intrusiva",
    description:
      "Invisible para usuarios autorizados. Actúa únicamente cuando detecta una divergencia de política. El flujo de desarrollo no se interrumpe.",
    proof: "Latencia media de inserción: 8ms.",
  },
  {
    index: "03",
    tag: "PERMANENTE",
    title: "Registro Inmutable",
    description:
      "Cada decisión en un sistema append-only. Ninguna entrada puede ser modificada o eliminada después de ser escrita.",
    proof: "Compatible con SOC 2, ISO 27001 y GDPR.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-36 border-t border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-16"
        >
          <p className="font-mono text-[10px] text-white/20 tracking-[0.18em] uppercase mb-4">
            // PRINCIPIOS
          </p>
          <h2
            className="font-display font-bold text-white tracking-[-0.04em] leading-[1.06]"
            style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
          >
            Precisión. Silencio.<br />Permanencia.
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06]"
        >
          {features.map((f) => (
            <motion.div
              key={f.index}
              variants={cardVariants}
              className="bg-black p-8 md:p-10 flex flex-col gap-5 group hover-lift relative overflow-hidden cursor-default"
            >
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/[0.1] pointer-events-none transition-all duration-300 group-hover:border-white/22" />
              <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/[0.05] pointer-events-none transition-all duration-300 group-hover:border-white/12" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/[0.05] pointer-events-none transition-all duration-300 group-hover:border-white/12" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/[0.1] pointer-events-none transition-all duration-300 group-hover:border-white/22" />

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/20">{f.index}</span>
                <span className="font-mono text-[9px] text-white/12 tracking-[0.15em] uppercase px-1.5 py-0.5 border border-white/[0.06] group-hover:border-white/12 transition-colors">
                  {f.tag}
                </span>
              </div>

              <h3
                className="font-display font-semibold text-white tracking-[-0.025em] leading-[1.25]"
                style={{ fontSize: "clamp(18px, 1.5vw, 22px)" }}
              >
                {f.title}
              </h3>

              <p className="font-mono text-[#555] text-[12px] leading-[1.8] flex-1">
                {f.description}
              </p>

              <div className="pt-5 border-t border-white/[0.06] flex items-start gap-2">
                <div className="w-px h-3 bg-white/20 shrink-0 mt-0.5 group-hover:bg-white/35 transition-colors" />
                <p className="font-mono text-[11px] text-white/35 tracking-[0.03em] group-hover:text-white/55 transition-colors">
                  {f.proof}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
