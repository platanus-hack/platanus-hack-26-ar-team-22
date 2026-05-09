// POST /api/cli/logout — revoca el token presente en el Authorization header.
// Idempotente: si el token ya estaba revocado o no existe, devuelve OK igual.

import { resolveCliCaller } from "@/lib/cli-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const caller = await resolveCliCaller(request);
  if (!caller) {
    // Token inválido: tratamos como "ya estabas afuera".
    return Response.json({ revoked: false });
  }
  await prisma.cliToken.update({
    where: { id: caller.tokenId },
    data: { revokedAt: new Date() },
  });
  return Response.json({ revoked: true });
}
