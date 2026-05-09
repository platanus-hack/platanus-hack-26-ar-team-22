import { ActionBadge, type ProxyAction } from "./ActionBadge";

export type TraceStep = {
  label: string;
  source: "Regex" | "Pattern" | "Haiku" | "Policy";
  action: ProxyAction;
  detail: string;
  latencyMs?: number;
};

export function TracePanel({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold tracking-tight">Trace de decisión</h3>
        <span className="text-sm text-muted-foreground">{steps.length} checks</span>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={`${step.source}-${step.label}`} className="flex gap-3 rounded-xl border border-border bg-background p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{step.label}</span>
                <ActionBadge action={step.action} />
                <span className="text-xs text-muted-foreground">{step.source}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p>
            </div>
            {typeof step.latencyMs === "number" ? <div className="text-sm text-muted-foreground">{step.latencyMs}ms</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
