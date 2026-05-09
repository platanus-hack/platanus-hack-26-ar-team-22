// Helper compartido por endpoints /api/cli/* — resuelve el `Authorization:
// Bearer tk_...` del request a un member válido.

import { hashCliToken } from "@/lib/cli-tokens";
import { prisma } from "@/lib/prisma";

export type CliCaller = {
  tokenId: string;
  memberId: string;
  email: string;
  role: "admin" | "dev";
  orgId: string;
  orgName: string;
};

export async function resolveCliCaller(request: Request): Promise<CliCaller | null> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token.startsWith("tk_")) return null;

  const tokenHash = hashCliToken(token);
  const row = await prisma.cliToken.findUnique({
    where: { tokenHash },
    include: {
      member: {
        include: { organization: { select: { id: true, name: true } } },
      },
    },
  });

  if (!row || row.revokedAt) return null;

  // Background refresh — no bloqueamos la response.
  void prisma.cliToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    tokenId: row.id,
    memberId: row.member.id,
    email: row.member.email,
    role: row.member.role as "admin" | "dev",
    orgId: row.member.organization.id,
    orgName: row.member.organization.name,
  };
}
