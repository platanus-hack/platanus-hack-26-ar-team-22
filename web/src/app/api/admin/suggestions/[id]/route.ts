import { requireAdminRole } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const session = auth.session;

  const { id } = await params;
  const { action, rejectReason } = await request.json();

  if (action !== "accept" && action !== "reject") {
    return Response.json({ error: "action must be accept or reject" }, { status: 400 });
  }

  const suggestion = await prisma.ruleSuggestion.findUnique({
    where: { id, orgId: session.orgId },
  });
  if (!suggestion) return Response.json({ error: "not found" }, { status: 404 });
  if (suggestion.status !== "pending") {
    return Response.json({ error: "ya fue procesada" }, { status: 409 });
  }

  if (action === "reject") {
    await prisma.ruleSuggestion.update({
      where: { id },
      data: { status: "rejected", rejectReason: rejectReason ?? null, decidedAt: new Date() },
    });
    return Response.json({ ok: true });
  }

  // accept: promover a policies
  const policy = await prisma.$transaction(async (tx) => {
    const created = await tx.policy.create({
      data: {
        orgId: session.orgId,
        slug: suggestion.proposedSlug,
        domain: suggestion.proposedDomain,
        layer: suggestion.proposedLayer,
        rule: suggestion.proposedRule,
        pattern: suggestion.proposedPattern,
        matchConfig: suggestion.proposedMatchConfig ?? undefined,
        defaultAction: suggestion.proposedAction,
        severity: suggestion.proposedSeverity,
        source: suggestion.sourceHint === "google_workspace" ? "google_workspace" : "ai_suggestor",
        isActive: true,
      },
    });
    await tx.ruleSuggestion.update({
      where: { id },
      data: { status: "accepted", acceptedPolicyId: created.id, decidedAt: new Date() },
    });
    return created;
  });

  return Response.json({ ok: true, policyId: policy.id });
}
