import { AdminFrame } from "../AdminFrame";
import { ActionBadge, DataTable, type DataColumn } from "@/components/data";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { listInteractions, type Interaction } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

const columns: DataColumn<Interaction>[] = [
  { key: "time", header: "Timestamp", cell: (row) => new Date(row.timestamp).toLocaleString("es-AR") },
  { key: "user", header: "Usuario", cell: (row) => <span className="font-mono text-xs">{row.user_id}</span> },
  { key: "prompt", header: "Prompt", cell: (row) => <span className="line-clamp-2 max-w-xl">{row.prompt}</span> },
  { key: "decision", header: "Decisión", cell: (row) => <ActionBadge action={row.decision === "BLOCKED" ? "BLOCK" : "LOG"} /> },
  { key: "reason", header: "Motivo", cell: (row) => row.reason },
];

export default function InteractionsPage() {
  const interactions = listInteractions();

  return (
    <AdminFrame>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Interactions"
          title="Todas las peticiones"
          description="Feed mock de requests evaluadas por Guardrail."
        />
        <Card>
          <CardHeader>
            <CardTitle>Requests evaluadas</CardTitle>
            <CardDescription>La tabla usa el schema `interactions` definido para la demo.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={interactions} getRowKey={(row) => row.id} />
          </CardContent>
        </Card>
      </div>
    </AdminFrame>
  );
}
