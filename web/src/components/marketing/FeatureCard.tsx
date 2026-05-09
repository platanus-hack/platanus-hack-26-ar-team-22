import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui";

export function FeatureCard({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="pt-6">
        {icon ? <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div> : null}
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
