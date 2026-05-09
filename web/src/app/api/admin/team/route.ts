// /api/admin/team — listar y agregar members de la org del admin logueado.
// Solo admins pueden modificar (los dev no tienen acceso al back-office por
// ahora, pero gateamos igual por defensa).
import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { isValidEmail, toMemberDTO } from "@/lib/team";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.member.findMany({
    where: { orgId: session.orgId },
    include: { user: { select: { emailVerified: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return Response.json({ members: rows.map(toMemberDTO) });
}

type CreateBody = {
  email?: string;
};

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  const email = (body?.email ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "email inválido" }, { status: 400 });
  }

  try {
    const created = await prisma.member.create({
      data: {
        orgId: session.orgId,
        email,
        role: "dev",
      },
      include: { user: { select: { emailVerified: true } } },
    });
    return Response.json({ member: toMemberDTO(created) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Unique constraint")) {
      return Response.json(
        { error: `ya existe un member con email "${email}" en esta org` },
        { status: 409 },
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
