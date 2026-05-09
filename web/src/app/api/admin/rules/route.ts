// CRUD de policies del admin.
// El proxy lee `policies` en cada request, así que toda mutación acá se
// refleja en el próximo prompt sin caché ni fanout.
import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import {
  ADMIN_ACTIONS,
  POLICY_DOMAINS,
  SEVERITIES,
  slugify,
  toRuleDTO,
  type AdminAction,
  type PolicyDomain,
  type Severity,
} from "@/lib/policies";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await prisma.policy.findMany({
    where: { orgId: session.orgId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
  return Response.json({ rules: rows.map(toRuleDTO) });
}

type CreateBody = {
  name?: string;
  slug?: string;
  rule?: string;
  domain?: string;
  defaultAction?: string;
  severity?: string;
};

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as CreateBody | null;
  if (!body) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const ruleText = (body.rule ?? "").trim();
  const domain = body.domain as PolicyDomain | undefined;
  const action = body.defaultAction as AdminAction | undefined;
  const severity = (body.severity ?? "medium") as Severity;
  const baseName = (body.slug ?? body.name ?? "").trim();

  const errors: string[] = [];
  if (!ruleText) errors.push("rule es requerido");
  if (!baseName) errors.push("name es requerido");
  if (!domain || !POLICY_DOMAINS.includes(domain)) errors.push("domain inválido");
  if (!action || !ADMIN_ACTIONS.includes(action)) errors.push("defaultAction inválido");
  if (!SEVERITIES.includes(severity)) errors.push("severity inválido");
  if (errors.length) {
    return Response.json({ error: errors.join(", ") }, { status: 400 });
  }

  const slug = slugify(baseName);
  if (!slug) {
    return Response.json({ error: "slug vacío después de normalizar" }, { status: 400 });
  }

  try {
    const created = await prisma.policy.create({
      data: {
        orgId: session.orgId,
        slug,
        domain: domain!,
        layer: "nl",
        rule: ruleText,
        defaultAction: action!,
        severity,
        source: "admin",
        isActive: true,
      },
    });
    return Response.json({ rule: toRuleDTO(created) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Unique constraint")) {
      return Response.json({ error: `ya existe una regla con slug "${slug}"` }, { status: 409 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
