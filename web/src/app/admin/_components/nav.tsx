"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/events", label: "eventos", caption: "lo que pasa" },
  { href: "/admin/rules", label: "reglas", caption: "qué controla" },
  { href: "/admin/suggestions", label: "sugerencias", caption: "por aprobar" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex flex-col border-l-2 py-2 pl-4 transition-colors ${
              active
                ? "border-ink text-ink"
                : "border-transparent text-graphite hover:border-graphite-dark/40 hover:text-ink"
            }`}
          >
            <span className="text-base font-medium lowercase tracking-tight">
              {item.label}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
              // {item.caption}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
