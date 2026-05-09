"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useState, useTransition } from "react";
import { isValidEmail, type MemberDTO } from "@/lib/team";

export function TeamPanel({
  initialMembers,
  currentEmail,
}: {
  initialMembers: MemberDTO[];
  currentEmail: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  async function handleRemove(member: MemberDTO) {
    if (!confirm(`¿Remover a "${member.email}" del equipo?`)) return;
    const res = await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "no se pudo remover");
      return;
    }
    await refresh();
  }

  const admins = members.filter((m) => m.role === "admin");
  const devs = members.filter((m) => m.role === "dev");

  return (
    <div className="flex flex-col gap-8">
      {/* Form */}
      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-4 border border-graphite-dark/20 bg-paper p-6"
        style={{ borderRadius: "var(--radius)" }}
      >
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // invitar dev
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
          <p className="font-mono text-xs text-red-600">// {error}</p>
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
          <div className="px-4 py-8 text-center font-mono text-xs text-graphite">
            // sin miembros en este rol
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
                      className="font-mono text-[11px] uppercase tracking-wider text-graphite transition-colors hover:text-red-600"
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

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        active ? "bg-emerald-500" : "bg-graphite/40"
      }`}
    />
  );
}
