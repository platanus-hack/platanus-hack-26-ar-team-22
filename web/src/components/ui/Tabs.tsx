"use client";

import type { ReactNode } from "react";
import { cn } from "./utils";

type TabItem = {
  value: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  children?: ReactNode;
};

export function Tabs({ items, value, onChange, children }: TabsProps) {
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-2xl border border-border bg-muted p-1">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition",
              value === item.value && "bg-card text-foreground shadow-sm",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
