type Metric = {
  label: string;
  value: string;
};

export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl bg-muted p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</div>
        </div>
      ))}
    </div>
  );
}
