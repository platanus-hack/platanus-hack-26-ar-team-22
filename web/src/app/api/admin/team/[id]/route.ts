// DELETE /api/admin/team/[id] — remover member de la org actual.
// No se puede eliminar al último admin (te dejarías sin acceso).
import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/team/[id]">,
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const target = await prisma.member.findFirst({
    where: { id, orgId: session.orgId },
  });
  if (!target) return Response.json({ error: "member no encontrado" }, { status: 404 });

  if (target.role === "admin") {
    const adminCount = await prisma.member.count({
      where: { orgId: session.orgId, role: "admin" },
    });
    if (adminCount <= 1) {
      return Response.json(
        { error: "no podés eliminar al único admin de la org" },
        { status: 400 },
      );
    }
  }

  await prisma.member.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
