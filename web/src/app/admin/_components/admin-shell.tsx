"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { TranqueraMark } from "@/components/brand/tranquera-mark";

import { AdminNav, NAV_ITEMS } from "./nav";

type AdminShellProps = {
  email: string;
  orgId: string;
  authConfigured: boolean;
  signOut: ReactNode;
  themeSwitcher: ReactNode;
  children: ReactNode;
};

export function AdminShell({
  email,
  orgId,
  authConfigured,
  signOut,
  themeSwitcher,
  children,
}: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) =>
    "exact" in i && i.exact
      ? pathname === i.href
      : pathname === i.href || pathname.startsWith(i.href + "/"),
  );
  const breadcrumb = current?.label ?? "admin";

  // Lock body scroll when drawer is open on mobile.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-graphite-dark/15 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="abrir menú"
              aria-expanded={open}
              className="flex h-9 w-9 items-center justify-center border border-graphite-dark/25 text-ink transition-colors hover:border-ink md:hidden"
              style={{ borderRadius: "var(--radius)" }}
            >
              <HamburgerIcon className="h-4 w-4" />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <TranqueraMark className="h-6 w-6" />
              <span className="text-xl font-semibold lowercase tracking-tight">
                tranquera
              </span>
              <span className="ml-3 hidden border-l border-graphite-dark/20 pl-3 font-mono text-xs uppercase tracking-wider text-graphite md:inline">
                admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-graphite md:gap-4">
            <span className="hidden sm:inline">// org · {orgId}</span>
            <span
              className="hidden md:inline"
              title={email}
            >
              // {email}
            </span>
            <EmailDot email={email} />
            {authConfigured ? signOut : null}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open ? (
          <motion.div
            key="drawer-root"
            className="fixed inset-0 z-40 md:hidden"
          >
            <motion.button
              type="button"
              aria-label="cerrar menú"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 32,
                mass: 0.8,
              }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-8 border-r border-graphite-dark/20 bg-paper p-6 shadow-[8px_0_40px_-20px_rgba(28,27,24,0.45)]"
            >
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setOpen(false)}
                >
                  <TranqueraMark className="h-6 w-6" />
                  <span className="text-base font-semibold lowercase tracking-tight">
                    tranquera
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="cerrar menú"
                  className="flex h-8 w-8 items-center justify-center font-mono text-graphite transition-colors hover:text-ink"
                >
                  ✕
                </button>
              </div>
              <AdminNav onNavigate={() => setOpen(false)} />
              {themeSwitcher}
              <p className="mt-auto font-mono text-[11px] leading-relaxed text-graphite">
                // org · {orgId}
                <br />
                // {authConfigured ? "google session" : "demo session"}
              </p>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto flex max-w-6xl items-start gap-8 px-6 py-8 md:py-14">
        {/* Sticky sidebar — stays in place while the main column scrolls.
            Top offset (~73px) clears the sticky header. */}
        <aside className="sticky top-[73px] hidden w-44 shrink-0 flex-col gap-10 self-start md:flex">
          <AdminNav />
          {themeSwitcher}
          <p className="mt-auto font-mono text-[11px] leading-relaxed text-graphite">
            // org · {orgId}
            <br />
            // {authConfigured ? "google session" : "demo session"}
          </p>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <Breadcrumb section={breadcrumb} />
          <div className="flex flex-1 flex-col">{children}</div>
        </main>
      </div>
    </>
  );
}

function Breadcrumb({ section }: { section: string }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-graphite">
      // admin · {section}
    </p>
  );
}

function HamburgerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4 L14 4" />
      <path d="M2 8 L14 8" />
      <path d="M2 12 L14 12" />
    </svg>
  );
}

function EmailDot({ email }: { email: string }) {
  // Single character avatar derived from the email — fills the gap when the
  // full address is hidden by the responsive layout.
  const ch = email[0]?.toUpperCase() ?? "?";
  return (
    <span
      title={email}
      aria-label={email}
      className="flex h-7 w-7 items-center justify-center border border-graphite-dark/25 font-mono text-[11px] font-semibold text-ink md:hidden"
      style={{ borderRadius: "var(--radius)" }}
    >
      {ch}
    </span>
  );
}
