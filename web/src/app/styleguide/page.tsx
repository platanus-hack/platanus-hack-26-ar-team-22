"use client";

import { useState } from "react";
import { ActionBadge, CodePanel, DataTable, EmptyState, MetricStrip, SeverityBadge, StatCard, TracePanel, type DataColumn } from "@/components/data";
import { AppShell, PageHeader, ThemeToggle } from "@/components/layout";
import { FeatureCard, HeroSection, Timeline } from "@/components/marketing";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Modal, Select, Tabs, Textarea, ToastProvider, useToast } from "@/components/ui";

type PolicyPreview = {
  id: string;
  domain: string;
  rule: string;
  severity: "low" | "medium" | "high" | "critical";
  action: "BLOCK" | "REDACT" | "WARN" | "LOG";
};

const policies: PolicyPreview[] = [
  { id: "pol_1", domain: "business", rule: "No exponer nombres de clientes reales", severity: "high", action: "REDACT" },
  { id: "pol_2", domain: "code", rule: "Bloquear secretos y credenciales", severity: "critical", action: "BLOCK" },
  { id: "pol_3", domain: "internal", rule: "Loggear paths internos sensibles", severity: "medium", action: "WARN" },
];

const columns: DataColumn<PolicyPreview>[] = [
  { key: "domain", header: "Dominio", cell: (row) => row.domain },
  { key: "rule", header: "Regla", cell: (row) => row.rule },
  { key: "severity", header: "Severidad", cell: (row) => <SeverityBadge severity={row.severity} /> },
  { key: "action", header: "Acción", cell: (row) => <ActionBadge action={row.action} /> },
];

function ToastDemoButton() {
  const { showToast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => showToast({ title: "Política guardada", description: "El cambio queda disponible para la demo.", tone: "success" })}
    >
      Mostrar toast
    </Button>
  );
}

export default function StyleguidePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("ui");

  return (
    <ToastProvider>
      <AppShell>
        <div className="space-y-10">
          <PageHeader
            eyebrow="Design system"
            title="Componentes base de Guardrail"
            description="Kit minimal SaaS para landing, admin y playground. Esta ruta existe para validar estilo, tema y estados antes de construir pantallas finales."
            actions={<ThemeToggle />}
          />

          <HeroSection
            eyebrow="AI Security"
            title="Una UI consistente antes de escribir pantallas de demo."
            description="Componentes propios, sin shadcn, con tokens compartidos y soporte de tema claro/oscuro persistente."
            actions={
              <>
                <Button>Acción primaria</Button>
                <Button variant="secondary">Acción secundaria</Button>
              </>
            }
            visual={
              <CodePanel
                title="policy.json"
                code={`{
  "domain": "code",
  "decision": "BLOCK",
  "reason": "Detectamos una credencial en el prompt"
}`}
              />
            }
          />

          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "ui", label: "UI" },
              { value: "data", label: "Datos" },
              { value: "marketing", label: "Marketing" },
            ]}
          />

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Requests 24h" value="1.284" delta="+12% vs ayer" tone="good" />
            <StatCard label="BLOCK" value="84" delta="6,5% del total" tone="bad" />
            <StatCard label="REDACT" value="219" delta="17% del total" />
            <StatCard label="p50 proxy" value="143ms" delta="Dentro del objetivo" tone="good" />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Controles</CardTitle>
                <CardDescription>Botones, inputs, badges, modal y toast.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="admin@guardrail.dev" />
                  <Select defaultValue="business">
                    <option value="business">business</option>
                    <option value="code">code</option>
                  </Select>
                </div>
                <Textarea placeholder="Escribí una política en lenguaje natural..." />
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="success">APPROVED</Badge>
                  <ActionBadge action="BLOCK" />
                  <ActionBadge action="REDACT" />
                  <ActionBadge action="WARN" />
                  <ActionBadge action="LOG" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => setModalOpen(true)}>Abrir modal</Button>
                  <ToastDemoButton />
                </div>
              </CardContent>
            </Card>

            <TracePanel
              steps={[
                { label: "AWS Access Key", source: "Regex", action: "BLOCK", detail: "El prompt contiene un patrón compatible con credenciales AWS.", latencyMs: 4 },
                { label: "Customer mention", source: "Policy", action: "REDACT", detail: "La política pide ocultar nombres de clientes reales.", latencyMs: 28 },
                { label: "Audit baseline", source: "Haiku", action: "LOG", detail: "No hay riesgo adicional para este rol.", latencyMs: 117 },
              ]}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <DataTable columns={columns} rows={policies} getRowKey={(row) => row.id} />
            <div className="space-y-6">
              <MetricStrip metrics={[{ label: "Active policies", value: "18" }, { label: "Blocked", value: "84" }, { label: "Redacted", value: "219" }, { label: "Warnings", value: "37" }]} />
              <EmptyState title="Sin sugerencias pendientes" description="Cuando el suggestor encuentre un patrón repetido, va a aparecer acá." action={<Button variant="secondary">Ver policies</Button>} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <FeatureCard title="Reglas no-code" description="El admin define políticas sin regex ni SQL." />
            <FeatureCard title="Trace auditable" description="Cada decisión muestra acción, motivo y latencia." />
            <FeatureCard title="Demo-ready" description="Los componentes ya cubren landing, admin y playground." />
          </section>

          <Timeline
            items={[
              { title: "Claude Code", description: "El dev manda un prompt como siempre." },
              { title: "Interceptor", description: "La cascada decide BLOCK, REDACT, WARN o LOG." },
              { title: "Admin", description: "Compliance ve interacciones y ajusta políticas." },
            ]}
          />
        </div>

        <Modal
          open={modalOpen}
          title="Detalle de interaction"
          description="Modal base para ver requests, policies o traces."
          onClose={() => setModalOpen(false)}
          footer={<Button onClick={() => setModalOpen(false)}>Cerrar</Button>}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Prompt bloqueado porque contenía una credencial. Este componente se reutilizará en admin interactions.
          </p>
        </Modal>
      </AppShell>
    </ToastProvider>
  );
}
