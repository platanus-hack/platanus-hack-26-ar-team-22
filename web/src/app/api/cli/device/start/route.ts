// POST /api/cli/device/start
// Inicio del device flow. El CLI pega acá ANTES de saber quién es el user;
// no requiere auth. El backend genera device_code + user_code y los guarda
// con status=pending. El user después los aprueba desde el browser
// (post-login Google).
//
// Body opcional: { "org_id": "acme" } — si el dev corrió `npx tranquera
// setup --org-id acme`, lo guardamos en el device code para joinearlo a
// esa org cuando apruebe desde el browser.

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
  return (
    process.env.TRANQUERA_PROXY_URL ??
    "https://platanus-hack-26-ar-team-22-production.up.railway.app"
  );
}

export async function POST(request: Request) {
  let orgInviteId: string | null = null;
  try {
    const body = (await request.json()) as { org_id?: unknown };
    if (typeof body?.org_id === "string" && body.org_id.trim()) {
      orgInviteId = body.org_id.trim();
    }
  } catch {
    // Body vacío o no-JSON: el CLI puede mandar POST sin body. No es error.
  }

  const deviceCode = generateDeviceCode();
  const userCode = generateUserCode();
  const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_MS);

  await prisma.cliDeviceCode.create({
    data: { deviceCode, userCode, expiresAt, status: "pending", orgInviteId },
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
