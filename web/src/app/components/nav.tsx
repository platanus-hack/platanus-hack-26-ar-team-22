"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TranqueraLogo from "./tranquera-logo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const links = [
  { label: "Architecture", href: "#how-it-works" },
  { label: "Protocols", href: "#features" },
  { label: "Terminal", href: "#terminal" },
  { label: "Acceso", href: "#waitlist" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/95 backdrop-blur-md border-b border-white/[0.08]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-14">
          <a href="#" className="flex items-center shrink-0" aria-label="Tranquera">
            <TranqueraLogo className="block h-[28px] w-[152px] shrink-0 text-white opacity-100" />
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="font-mono text-[12px] text-[#666] hover:text-[#ccc] transition-colors tracking-[0.05em]"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="#waitlist"
              className="font-mono text-[12px] text-black bg-white px-4 py-1.5 hover:bg-[#e8e8e8] transition-colors tracking-[0.04em]"
            >
              Solicitar acceso
            </a>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex flex-col gap-[5px] p-2 -mr-2"
            aria-label="Abrir menú"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="block w-5 h-px bg-white origin-center"
              transition={{ duration: 0.2 }}
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-5 h-px bg-white"
              transition={{ duration: 0.15 }}
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="block w-5 h-px bg-white origin-center"
              transition={{ duration: 0.2 }}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.24, ease: EASE }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[260px] bg-[#050505] border-l border-white/[0.08] flex flex-col pt-20 px-8 pb-8"
            >
              <nav className="flex flex-col gap-5 mb-10">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-[13px] text-[#888] hover:text-white transition-colors tracking-[0.05em]"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto">
                <a
                  href="#waitlist"
                  onClick={() => setMobileOpen(false)}
                  className="block font-mono text-[12px] text-black bg-white px-4 py-3 text-center hover:bg-[#e8e8e8] transition-colors tracking-[0.04em]"
                >
                  Solicitar acceso
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
