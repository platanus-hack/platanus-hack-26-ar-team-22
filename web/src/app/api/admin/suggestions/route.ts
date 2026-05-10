import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const suggestions = await prisma.ruleSuggestion.findMany({
    where: { orgId: session.orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      proposedSlug: true,
      proposedDomain: true,
      proposedLayer: true,
      proposedRule: true,
      proposedPattern: true,
      proposedAction: true,
      proposedSeverity: true,
      sourceHint: true,
      status: true,
      matchCount: true,
      examples: true,
    },
  });

  return Response.json({ suggestions });
}
