import type { ReactNode } from "react";
import { cn } from "@/components/ui";

type AdminNavItem = {
  href: string;
  label: string;
  active?: boolean;
  badge?: ReactNode;
};

type AdminSidebarProps = {
  items: AdminNavItem[];
  brand?: string;
};

export function AdminSidebar({ items, brand = "Guardrail" }: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-border bg-card p-5 md:w-72">
      <div className="mb-8">
        <div className="text-lg font-semibold tracking-tight">{brand}</div>
        <div className="text-sm text-muted-foreground">AI policy firewall</div>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
              item.active && "bg-primary/10 text-primary",
            )}
          >
            {item.label}
            {item.badge}
          </a>
        ))}
      </nav>
    </aside>
  );
}
