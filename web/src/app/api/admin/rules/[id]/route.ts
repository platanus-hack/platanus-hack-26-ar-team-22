import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import {
  ADMIN_ACTIONS,
  POLICY_DOMAINS,
  SEVERITIES,
  toRuleDTO,
  type AdminAction,
  type PolicyDomain,
  type Severity,
} from "@/lib/policies";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  isActive?: boolean;
  rule?: string;
  defaultAction?: string;
  severity?: string;
  domain?: string;
};

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/rules/[id]">,
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.rule === "string" && body.rule.trim()) data.rule = body.rule.trim();
  if (typeof body.defaultAction === "string") {
    if (!ADMIN_ACTIONS.includes(body.defaultAction as AdminAction)) {
      return Response.json({ error: "defaultAction inválido" }, { status: 400 });
    }
    data.defaultAction = body.defaultAction;
  }
  if (typeof body.severity === "string") {
    if (!SEVERITIES.includes(body.severity as Severity)) {
      return Response.json({ error: "severity inválido" }, { status: 400 });
    }
    data.severity = body.severity;
  }
  if (typeof body.domain === "string") {
    if (!POLICY_DOMAINS.includes(body.domain as PolicyDomain)) {
      return Response.json({ error: "domain inválido" }, { status: 400 });
    }
    data.domain = body.domain;
  }

  if (!Object.keys(data).length) {
    return Response.json({ error: "nada para actualizar" }, { status: 400 });
  }

  try {
    const updated = await prisma.policy.update({
      where: { id, orgId: session.orgId },
      data,
    });
    return Response.json({ rule: toRuleDTO(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Record to update not found")) {
      return Response.json({ error: "rule no encontrada" }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/rules/[id]">,
) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.policy.delete({ where: { id, orgId: session.orgId } });
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Record to delete does not exist")) {
      return Response.json({ error: "rule no encontrada" }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
