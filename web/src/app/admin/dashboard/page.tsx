import { AdminFrame } from "../AdminFrame";
import { ActionBadge, DataTable, StatCard, type DataColumn } from "@/components/data";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getMetrics, type Interaction } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

const columns: DataColumn<Interaction>[] = [
  { key: "user", header: "Usuario", cell: (row) => <span className="font-mono text-xs">{row.user_id}</span> },
  { key: "prompt", header: "Prompt", cell: (row) => <span className="line-clamp-2 max-w-md">{row.prompt}</span> },
  {
    key: "decision",
    header: "Decisión",
    cell: (row) => <ActionBadge action={row.decision === "BLOCKED" ? "BLOCK" : "LOG"} />,
  },
  { key: "reason", header: "Motivo", cell: (row) => row.reason },
];

function RequestBars({ buckets }: { buckets: Array<{ label: string; approved: number; blocked: number }> }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.approved + bucket.blocked));

  return (
    <div className="flex h-64 items-end gap-3 rounded-2xl border border-border bg-card p-5">
      {buckets.map((bucket) => {
        const approvedHeight = Math.max(8, (bucket.approved / max) * 180);
        const blockedHeight = Math.max(8, (bucket.blocked / max) * 180);
        return (
          <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-48 w-full max-w-16 items-end justify-center gap-1">
              <div className="w-5 rounded-t-lg bg-green-500/70" style={{ height: approvedHeight }} title={`${bucket.approved} aceptadas`} />
              <div className="w-5 rounded-t-lg bg-red-500/75" style={{ height: blockedHeight }} title={`${bucket.blocked} bloqueadas`} />
            </div>
            <span className="text-xs text-muted-foreground">{bucket.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function FlowGraph({ approved, blocked }: { approved: number; blocked: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafo del flujo</CardTitle>
        <CardDescription>Vista simplificada de cómo se separan las peticiones.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-border bg-muted p-6">
          <div className="absolute left-[23%] top-[35%] h-px w-[26%] bg-border" />
          <div className="absolute left-[51%] top-[29%] h-px w-[23%] -rotate-12 bg-green-500/50" />
          <div className="absolute left-[51%] top-[48%] h-px w-[23%] rotate-12 bg-red-500/50" />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="text-sm font-semibold">Users</div>
            <div className="mt-1 text-xs text-muted-foreground">Claude Code</div>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center shadow-sm">
            <div className="text-sm font-semibold text-primary">Policy Engine</div>
            <div className="mt-1 text-xs text-muted-foreground">Regex -&gt; Pattern -&gt; Haiku</div>
          </div>
          <div className="absolute right-6 top-12 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 shadow-sm">
            <div className="text-sm font-semibold text-green-700 dark:text-green-300">Aceptadas</div>
            <div className="mt-1 text-2xl font-semibold">{approved}</div>
          </div>
          <div className="absolute bottom-12 right-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 shadow-sm">
            <div className="text-sm font-semibold text-red-700 dark:text-red-300">Bloqueadas</div>
            <div className="mt-1 text-2xl font-semibold">{blocked}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const metrics = getMetrics();

  return (
    <AdminFrame>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Estado de peticiones"
          description="Resumen de requests aceptadas, bloqueadas y políticas activas para la demo."
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Peticiones totales" value={String(metrics.total)} delta="Mock server session" />
          <StatCard label="Bloqueadas" value={String(metrics.blocked)} delta={`${metrics.blockRate}% del total`} tone="bad" />
          <StatCard label="Aceptadas" value={String(metrics.approved)} delta="Sin política crítica" tone="good" />
          <StatCard label="Policies activas" value={String(metrics.activePolicies)} delta="Editables desde Admin" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Peticiones por hora</CardTitle>
              <CardDescription>Verde: aceptadas. Rojo: bloqueadas.</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestBars buckets={metrics.buckets} />
            </CardContent>
          </Card>
          <FlowGraph approved={metrics.approved} blocked={metrics.blocked} />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Últimas peticiones</CardTitle>
              <CardDescription>Requests recientes con decisión y motivo.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} rows={metrics.recent} getRowKey={(row) => row.id} />
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminFrame>
  );
}
