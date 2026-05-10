// Daily cron job endpoint for the AI Suggestor.
// GET /api/cron/suggestor
// Triggered by Vercel Cron (see vercel.json) at 09:00 UTC daily.
// Secured via Authorization: Bearer <CRON_SECRET>.
// If CRON_SECRET is not set, allows the call only outside production unless
// ALLOW_UNAUTHENTICATED_CRON=1 is explicitly set for a controlled demo.

import type { NextRequest } from "next/server";
import { runSuggestor } from "@/lib/suggestor";

export async function GET(request: NextRequest) {
  // Verify cron secret when configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (token !== cronSecret) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_UNAUTHENTICATED_CRON !== "1"
  ) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = process.env.DEMO_ORG_ID ?? "demo";

  try {
    const result = await runSuggestor(orgId);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error interno del suggestor";
    console.error("[api/cron/suggestor]", err);
    return Response.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
