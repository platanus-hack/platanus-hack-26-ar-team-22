// Mock admin session for the hack.
// The landing CTAs link to `/admin?demo=1`; the proxy (src/proxy.ts) sees the
// flag, sets the cookie, and redirects to `/admin/events`. Once the cookie is
// set, every protected route just checks for its presence.
//
// When real auth lands (Supabase Auth, post-hack), this whole module becomes
// the bridge between the cookie/session and `members.id` — same call sites,
// different implementation.

import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
export const DEMO_ORG_ID = "demo";

export type AdminSession = {
  orgId: string;
  email: string;
};

const DEMO_SESSION: AdminSession = {
  orgId: DEMO_ORG_ID,
  email: "admin@team22.dev",
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  if (value !== "demo") return null;
  return DEMO_SESSION;
}
