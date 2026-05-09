import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
