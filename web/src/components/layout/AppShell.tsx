import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

type AppShellProps = {
  sidebar?: ReactNode;
  children: ReactNode;
  userLabel?: string;
};

export function AppShell({ sidebar, children, userLabel = "admin@guardrail.dev" }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      {sidebar}
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur md:px-8">
          <div className="text-sm text-muted-foreground">Demo org</div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground sm:block">
              {userLabel}
            </div>
          </div>
        </div>
        <main className="mx-auto w-full max-w-7xl p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
