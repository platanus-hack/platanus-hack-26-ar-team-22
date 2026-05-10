// /admin/suggestions — cola de aprobación del AI Suggestor y de imports gdoc.
/* eslint-disable react/jsx-no-comment-textnodes */
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import {
  SuggestionsPanel,
  type CurrentRuleSnapshot,
} from "./_components/suggestions-panel";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const session = await getAdminSession();
  if (!session) return null;

  const rows = await prisma.ruleSuggestion.findMany({
    where: { orgId: session.orgId },
    orderBy: { createdAt: "desc" },
  });

  // Pull the current state of every policy whose slug matches an
  // incoming suggestion. The diff view in the panel needs both sides.
  const proposedSlugs = Array.from(new Set(rows.map((r) => r.proposedSlug)));
  const currentRules =
    proposedSlugs.length > 0
      ? await prisma.policy.findMany({
          where: { orgId: session.orgId, slug: { in: proposedSlugs } },
          select: {
            slug: true,
            domain: true,
            layer: true,
            rule: true,
            pattern: true,
            defaultAction: true,
            severity: true,
            isActive: true,
          },
        })
      : [];

  const currentBySlug: Record<string, CurrentRuleSnapshot> = {};
  for (const p of currentRules) {
    currentBySlug[p.slug] = {
      slug: p.slug,
      domain: p.domain,
      layer: p.layer,
      rule: p.rule,
      pattern: p.pattern,
      action: p.defaultAction,
      severity: p.severity,
      isActive: p.isActive,
    };
  }

  // gdoc suggestions first, then AI suggestor, preserving createdAt desc within each group
  const sorted = [
    ...rows.filter((r) => r.sourceHint === "google_workspace"),
    ...rows.filter((r) => r.sourceHint !== "google_workspace"),
  ];

  return (
    <section>
      <header className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // sugerencias
        </span>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Cola de aprobación.
        </h1>
        <p className="max-w-2xl text-graphite-dark">
          Reglas propuestas por el AI Suggestor o importadas desde Google Docs.
          Aceptar las convierte en políticas activas; el proxy las aplica al
          próximo request.
        </p>
      </header>
      <SuggestionsPanel
        initialSuggestions={sorted}
        currentBySlug={currentBySlug}
      />
    </section>
  );
}
