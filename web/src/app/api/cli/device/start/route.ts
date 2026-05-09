// POST /api/cli/device/start
// Inicio del device flow. El CLI pega acá ANTES de saber quién es el user;
// no requiere auth. El backend genera device_code + user_code y los guarda
// con status=pending. El user después los aprueba desde el browser
// (post-login Google).

import {
  DEVICE_CODE_TTL_MS,
  DEVICE_POLL_INTERVAL_S,
  generateDeviceCode,
  generateUserCode,
} from "@/lib/cli-tokens";
import { prisma } from "@/lib/prisma";

function appUrl(): string {
  return process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function proxyUrl(): string {
  // El CLI necesita saber a qué proxy apuntar `ANTHROPIC_BASE_URL`. Lo
  // exponemos en la respuesta de `start` para que el CLI no lo tenga que
  // tener hardcodeado por ambiente.
  return (
    process.env.TRANQUERA_PROXY_URL ??
    "https://platanus-hack-26-ar-team-22-production.up.railway.app"
  );
}

export async function POST() {
  const deviceCode = generateDeviceCode();
  const userCode = generateUserCode();
  const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_MS);

  await prisma.cliDeviceCode.create({
    data: { deviceCode, userCode, expiresAt, status: "pending" },
  });

  const verificationUri = `${appUrl()}/cli/connect?code=${encodeURIComponent(userCode)}`;

  return Response.json({
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: verificationUri,
    proxy_url: proxyUrl(),
    expires_in: Math.floor(DEVICE_CODE_TTL_MS / 1000),
    interval: DEVICE_POLL_INTERVAL_S,
  });
}
