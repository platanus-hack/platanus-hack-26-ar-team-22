"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar, AppShell } from "@/components/layout";

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin/dashboard", label: "Dashboard", active: pathname === "/admin/dashboard" },
    { href: "/admin/policies", label: "Policies", active: pathname === "/admin/policies" },
    { href: "/admin/interactions", label: "Interactions", active: pathname === "/admin/interactions" },
  ];

  return <AppShell sidebar={<AdminSidebar items={items} />}>{children}</AppShell>;
}
