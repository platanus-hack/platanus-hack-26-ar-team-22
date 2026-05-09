// /admin/rules — lista de reglas + form para crear regla NL.
// El proxy lee `policies` por request, así que crear acá ⇒ próximo prompt
// ya pasa por el judge con la nueva regla.
/* eslint-disable react/jsx-no-comment-textnodes */
import { getAdminSession } from "@/lib/admin-session";
import { toRuleDTO } from "@/lib/policies";
import { prisma } from "@/lib/prisma";
import { RulesPanel } from "./_components/rules-panel";
import { GdocImportForm } from "@/components/gdoc-import-form";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }
  const rows = await prisma.policy.findMany({
    where: { orgId: session.orgId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
  const initialRules = rows.map(toRuleDTO);

  return (
    <section>
      <header className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // reglas
        </span>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Lo que el firewall sabe controlar.
        </h1>
        <p className="max-w-2xl text-graphite-dark">
          Cada regla viaja al judge en cada request. Escribís en español lo que
          no querés que salga; el modelo decide si el prompt la viola.
        </p>
      </header>

      <div className="mb-10 border border-graphite-dark/20 p-6" style={{ borderRadius: "var(--radius)" }}>
        <span className="mb-3 block font-mono text-xs uppercase tracking-wider text-graphite">
          // importar desde Google Docs
        </span>
        <GdocImportForm />
      </div>

      <RulesPanel initialRules={initialRules} />
    </section>
  );
}
