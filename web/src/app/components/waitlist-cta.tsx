"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function WaitlistCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section id="waitlist" className="border-t border-white/[0.07]">
      <div className="bg-[#f5f5f3] text-black">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="font-mono text-[10px] text-black/30 tracking-[0.18em] uppercase mb-8">
              // ACCESO ANTICIPADO
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-end">
              <div>
                <h2
                  className="font-sans font-bold text-black leading-[1.04] tracking-[-0.03em] mb-5"
                  style={{ fontSize: "clamp(32px, 4.5vw, 64px)" }}
                >
                  Inicializar protocolo.
                </h2>
                <p className="font-sans text-black/50 text-[15px] leading-[1.7] max-w-[420px]">
                  Acceso anticipado para equipos que necesitan controlar lo que sus agentes envían al exterior.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="w-4 h-4 border border-black/40 flex items-center justify-center shrink-0">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="font-mono text-[13px] text-black/70 tracking-[0.04em]">
                      Registrado. Te contactamos pronto.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@empresa.com"
                      required
                      className="flex-1 border border-black/20 px-4 py-3 font-mono text-[13px] text-black placeholder:text-black/30 outline-none focus:border-black/50 bg-transparent sm:border-r-0 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-black text-white font-mono text-[12px] tracking-[0.05em] px-6 py-3 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 border border-black shrink-0"
                    >
                      {loading ? "···" : "Solicitar acceso"}
                    </button>
                  </form>
                )}

                <p className="font-mono text-[10px] text-black/25 tracking-[0.05em]">
                  Sin tarjeta. Sin compromiso. Equipos seleccionados.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
