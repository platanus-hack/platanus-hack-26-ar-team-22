"use server";

import { redirect } from "next/navigation";
import { generateCliToken, hashCliToken } from "@/lib/cli-tokens";
import { getAuthedUser } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

/**
 * Aprueba un device_code identificado por su user_code visible.
 * - Busca el device_code (debe estar pending y no vencido).
 * - Resuelve el member del usuario logueado vía userId (joinViaCli ya lo
 *   creó al renderizar la página).
 * - Genera token plaintext + hash, persiste cli_token.
 * - Marca el device_code como approved con el secret_token plaintext
 *   guardado para que el CLI lo recoja en su próximo poll.
 */
export async function approveDeviceCode(formData: FormData) {
  const userCodeRaw = formData.get("userCode");
  if (typeof userCodeRaw !== "string" || !userCodeRaw) {
    redirect("/cli/connect?error=missing_code");
  }
  const userCode = userCodeRaw.toUpperCase();

  const authed = await getAuthedUser();
  if (!authed) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(`/cli/connect?code=${userCode}`)}`);
  }

  // Buscamos el member por userId — el JWT puede no tener orgId todavía
  // (recién se joineó vía joinViaCli en la misma página), pero la DB sí.
  const member = await prisma.member.findUnique({
    where: { userId: authed!.userId },
  });
  if (!member) {
    throw new Error(
      "no encontré member para este userId — ¿el flujo joinViaCli falló silenciosamente?",
    );
  }

  const code = await prisma.cliDeviceCode.findUnique({
    where: { userCode },
  });
  if (!code) throw new Error("código inválido");
  if (code.status !== "pending") throw new Error(`código en estado ${code.status}`);
  if (code.expiresAt.getTime() < Date.now()) throw new Error("código vencido");

  const token = generateCliToken();
  const tokenHash = hashCliToken(token);

  // Transacción: crear el cli_token y marcar device_code en un solo paso.
  await prisma.$transaction(async (tx) => {
    const cliToken = await tx.cliToken.create({
      data: {
        memberId: member.id,
        tokenHash,
        label: `CLI · ${new Date().toISOString().slice(0, 10)}`,
      },
    });
    await tx.cliDeviceCode.update({
      where: { deviceCode: code.deviceCode },
      data: {
        status: "approved",
        memberId: member.id,
        approvedAt: new Date(),
        issuedTokenId: cliToken.id,
        secretToken: token,
      },
    });
  });

  redirect(`/cli/connect/done?code=${userCode}`);
}
