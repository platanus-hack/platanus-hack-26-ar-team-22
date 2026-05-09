"use client";

import { FormEvent, useState } from "react";
import { ActionBadge, SeverityBadge } from "@/components/data";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, Textarea } from "@/components/ui";
import type { Policy, PolicySeverity } from "@/lib/demo-store";

type FormState = {
  id?: string;
  domain: string;
  rule: string;
  severity: PolicySeverity;
  is_active: boolean;
};

const emptyForm: FormState = {
  domain: "business",
  rule: "",
  severity: "medium",
  is_active: true,
};

function actionForSeverity(severity: PolicySeverity) {
  if (severity === "critical") return "BLOCK";
  if (severity === "high") return "REDACT";
  if (severity === "medium") return "WARN";
  return "LOG";
}

export function PoliciesClient({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const response = await fetch("/api/admin/policies");
    const data = await response.json();
    setPolicies(data.policies);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const url = form.id ? `/api/admin/policies/${form.id}` : "/api/admin/policies";
    const method = form.id ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    await refresh();
    setLoading(false);
  }

  async function remove(policyId: string) {
    await fetch(`/api/admin/policies/${policyId}`, { method: "DELETE" });
    await refresh();
  }

  async function toggle(policy: Policy) {
    await fetch(`/api/admin/policies/${policy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !policy.is_active }),
    });
    await refresh();
  }

  function edit(policy: Policy) {
    setForm({
      id: policy.id,
      domain: policy.domain,
      rule: policy.rule,
      severity: policy.severity,
      is_active: policy.is_active,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Modificar policy" : "Agregar policy"}</CardTitle>
          <CardDescription>Se guarda en memoria para la demo. El embedding queda mockeado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Dominio</span>
              <Input value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} placeholder="business, code, audit" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Severidad</span>
              <Select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value as PolicySeverity })}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </Select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Regla</span>
              <Textarea value={form.rule} onChange={(event) => setForm({ ...form, rule: event.target.value })} placeholder="No permitir prompts que..." required />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              Policy activa
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading || !form.rule.trim()}>
                {form.id ? "Guardar cambios" : "Agregar policy"}
              </Button>
              {form.id ? (
                <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
                  Cancelar edición
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {policies.map((policy) => (
          <Card key={policy.id} className={!policy.is_active ? "opacity-60" : undefined}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{policy.domain}</span>
                    <SeverityBadge severity={policy.severity} />
                    <ActionBadge action={actionForSeverity(policy.severity)} />
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {policy.is_active ? "active" : "inactive"}
                    </span>
                  </div>
                  <p className="mt-3 leading-7">{policy.rule}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">id: {policy.id} · embedding: vector({policy.embedding.length})</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => edit(policy)}>
                    Modificar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => toggle(policy)}>
                    {policy.is_active ? "Desactivar" : "Activar"}
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => remove(policy.id)}>
                    Sacar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
