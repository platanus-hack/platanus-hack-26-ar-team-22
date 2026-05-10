"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useState, useTransition } from "react";
import { ConfirmDialog, Toast, type ConfirmConfig, type ToastState } from "@/components/feedback";
import { isValidEmail, type MemberDTO } from "@/lib/team";

export function TeamPanel({
  initialMembers,
  currentEmail,
  orgId,
}: {
  initialMembers: MemberDTO[];
  currentEmail: string;
  orgId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState>(null);
  const [pendingRemove, setPendingRemove] = useState<MemberDTO | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/team", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { members: MemberDTO[] };
      startTransition(() => setMembers(data.members));
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("email inválido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "no se pudo agregar");
        return;
      }
      setEmail("");
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemove(member: MemberDTO) {
    setPendingRemove(member);
  }

  async function confirmRemove() {
    const member = pendingRemove;
    setPendingRemove(null);
    if (!member) return;
    const res = await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setToast({ kind: "error", message: data?.error ?? "no se pudo remover" });
      return;
    }
    setToast({ kind: "success", message: `${member.email} fue removido del equipo` });
    await refresh();
  }

  const removeConfig: ConfirmConfig | null = pendingRemove
    ? {
        title: `¿Remover a ${pendingRemove.email}?`,
        body:
          pendingRemove.role === "admin"
            ? "Es admin. Va a perder acceso al back-office y a editar policies. Su atribución en eventos pasados se mantiene."
            : "Su token CLI deja de validar; sus prompts seguirán pasando por la tranquera con el rol default de la org pero ya no quedan atribuidos a esta cuenta.",
        confirmLabel: "Remover",
        cancelLabel: "Cancelar",
        destructive: true,
      }
    : null;

  const admins = members.filter((m) => m.role === "admin");
  const devs = members.filter((m) => m.role === "dev");

  const cliCommand = `npx tranquera setup --org-id ${orgId}`;

  return (
    <div className="flex flex-col gap-8">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={pendingRemove !== null}
        config={removeConfig}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />

      {/* Comando para self-join via CLI */}
      <CliInviteCard
        orgId={orgId}
        command={cliCommand}
        onCopyFailed={(value) =>
          setToast({
            kind: "error",
            message: `No pude copiar al portapapeles. Seleccioná manualmente: ${value}`,
          })
        }
      />

      {/* Form */}
      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-4 border border-graphite-dark/20 bg-paper p-6"
        style={{ borderRadius: "var(--radius)" }}
      >
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // invitar dev por email
        </span>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dev@tu-empresa.com"
            className="flex-1 border border-graphite-dark/30 bg-paper px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-graphite-dark disabled:opacity-60"
            style={{ borderRadius: "var(--radius)" }}
          >
            {submitting ? "agregando…" : "agregar dev"}
          </button>
        </div>
        {error ? (
          <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-ink">
            <span aria-hidden className="h-3 w-1 bg-ink" />
            // error · {error}
          </p>
        ) : null}
        <p className="font-mono text-[11px] leading-relaxed text-graphite">
          // el dev queda &quot;pendiente&quot; hasta que loguee por primera vez.
          // mientras tanto, ya puede correr `npx tranquera setup` y va a quedar
          activado al instante.
        </p>
      </form>

      {/* Lista */}
      <div className="flex flex-col gap-6">
        <MemberList
          title="admins"
          subtitle={`${admins.length} con acceso al back-office`}
          members={admins}
          currentEmail={currentEmail}
          onRemove={handleRemove}
        />
        <MemberList
          title="devs"
          subtitle={`${devs.length} ${devs.length === 1 ? "invitado" : "invitados"}, ${devs.filter((d) => d.linkedAt).length} activos`}
          members={devs}
          currentEmail={currentEmail}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
}

function MemberList({
  title,
  subtitle,
  members,
  currentEmail,
  onRemove,
}: {
  title: string;
  subtitle: string;
  members: MemberDTO[];
  currentEmail: string;
  onRemove: (m: MemberDTO) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-mono text-xs uppercase tracking-wider text-graphite">
          // {title}
        </h2>
        <span className="font-mono text-[11px] text-graphite">{subtitle}</span>
      </div>
      <div
        className="overflow-hidden border border-graphite-dark/20"
        style={{ borderRadius: "var(--radius)" }}
      >
        {members.length === 0 ? (
          <div className="flex flex-col items-start gap-2 px-4 py-6 text-graphite-dark">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-graphite">
              // sin miembros en este rol
            </span>
            <p className="text-sm leading-relaxed">
              Invitá un dev por email arriba para que aparezca acá. Hasta su
              primer login con Google queda en estado pendiente.
            </p>
          </div>
        ) : (
          <ul>
            {members.map((m, idx) => {
              const isMe = m.email === currentEmail;
              return (
                <li
                  key={m.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${
                    idx > 0 ? "border-t border-graphite-dark/15" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-sm text-ink">{m.email}</span>
                      {isMe ? (
                        <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
                          // vos
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-graphite">
                      <StatusDot active={!!m.linkedAt} />
                      <span>{m.linkedAt ? "activo · sesión vinculada" : "pendiente · esperando primer login"}</span>
                    </div>
                  </div>
                  {!isMe ? (
                    <button
                      type="button"
                      onClick={() => onRemove(m)}
                      className="font-mono text-[11px] uppercase tracking-wider text-graphite transition-colors hover:font-semibold hover:text-ink"
                    >
                      remover
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// Monochrome status: filled square = active, hollow square = pending.
// Keeps the admin shell within the brand palette per identidad/design.md § 6.
function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      title={active ? "active" : "pending"}
      className={`inline-block h-2 w-2 ${
        active ? "bg-ink" : "border border-graphite-dark/40"
      }`}
    />
  );
}

function CliInviteCard({
  orgId,
  command,
  onCopyFailed,
}: {
  orgId: string;
  command: string;
  onCopyFailed: (value: string) => void;
}) {
  const [copied, setCopied] = useState<"command" | "org" | null>(null);

  async function copy(value: string, kind: "command" | "org") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1500);
    } catch {
      onCopyFailed(value);
    }
  }

  return (
    <div
      className="flex flex-col gap-4 border border-ink/30 bg-ink/[0.03] p-6"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // invitar dev por CLI
        </span>
        <span className="font-mono text-[11px] text-graphite">
          // org-id ·{" "}
          <button
            type="button"
            onClick={() => copy(orgId, "org")}
            className="text-ink underline-offset-2 hover:underline"
            title="copiar org-id"
          >
            {orgId}
          </button>
          {copied === "org" ? (
            <span className="ml-2 font-semibold text-ink">copiado ✓</span>
          ) : null}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-graphite-dark">
        Compartile este comando a tu dev (slack, email, lo que sea). Lo corre
        en su terminal, loguea con Google, y queda atribuido a tu org como{" "}
        <strong>dev</strong>.
      </p>

      <div
        className="flex items-center justify-between gap-3 border border-graphite-dark/20 bg-paper px-4 py-3"
        style={{ borderRadius: "var(--radius)" }}
      >
        <code className="overflow-x-auto whitespace-nowrap font-mono text-sm text-ink">
          {command}
        </code>
        <button
          type="button"
          onClick={() => copy(command, "command")}
          className="shrink-0 bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-graphite-dark"
          style={{ borderRadius: "var(--radius)" }}
        >
          {copied === "command" ? "copiado ✓" : "copiar"}
        </button>
      </div>

      <p className="font-mono text-[11px] leading-relaxed text-graphite">
        // si el dev nunca corrió el comando con --org-id y no fue invitado por
        email, va a ver un error claro: &quot;no perteneces a ninguna org&quot;.
      </p>
    </div>
  );
}
