// Resolver de la session del admin. Funciona en dos modos:
//
//   1. Google Auth (si GOOGLE_CLIENT_ID está configurado): devuelve la
//      session real de Auth.js. Fase 2 va a resolver el `orgId` mirando
//      el email del user contra members + organizations.
//
//   2. Demo bypass: devuelve la mock session si el modo demo está habilitado
//      y la cookie `admin_session=demo` está presente.
//
// Las dos formas devuelven el mismo shape, así que los callers no se
// enteran del modo.

import { cookies } from "next/headers";
import { auth, isAuthConfigured } from "@/auth";
import { isDemoAdminModeEnabled } from "@/lib/auth-mode";
import { createOrgForNewAdmin } from "@/lib/org-resolution";

export const ADMIN_COOKIE = "admin_session";
export const DEMO_ORG_ID = "demo";

export type AdminSession = {
  orgId: string;
  email: string;
  /** "admin" → puede editar policies/team/etc. "dev" → solo lectura. */
  role: "admin" | "dev";
  name?: string | null;
  image?: string | null;
};

const DEMO_SESSION: AdminSession = {
  orgId: DEMO_ORG_ID,
  email: "admin@team22.dev",
  role: "admin",
};

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isAuthConfigured()) {
    const session = await auth();
    if (!session?.user?.email) return null;
    if (!session.user.orgId) {
      // El JWT no tiene orgId todavía. El admin layout debió haber corrido
      // ensureAdminSession antes de renderizar; si llegamos acá sin org es
      // porque el caller es una página que no quiere/puede onboardear (ej.
      // /cli/connect, que tiene su propio flujo). Tratamos como no logueado.
      return null;
    }
    return {
      orgId: session.user.orgId,
      email: session.user.email,
      role: session.user.role ?? "admin",
      name: session.user.name,
      image: session.user.image,
    };
  }

  if (!isDemoAdminModeEnabled()) return null;

  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  if (value !== "demo") return null;
  return DEMO_SESSION;
}

/**
 * Igual que getAdminSession pero rechaza devs. Usar en endpoints mutating
 * (`/api/admin/team`, `/api/admin/rules`, etc.). Devuelve la session si es
 * admin, o un Response 403 que el caller debe `return`-ear.
 */
export async function requireAdminRole(): Promise<
  { ok: true; session: AdminSession } | { ok: false; response: Response }
> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, response: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (session.role !== "admin") {
    return {
      ok: false,
      response: Response.json(
        { error: "forbidden: solo los admins pueden hacer esto" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, session };
}

/**
 * Igual que getAdminSession, pero si el user logueó vía Google y todavía
 * no tiene org, la crea automáticamente como admin owner. Solo se llama
 * desde rutas /admin/* — el "admin sign-up" del web es exactamente esto.
 *
 * El JWT del request actual sigue sin tener orgId (NextAuth lo recalcula
 * al próximo refresh), así que devolvemos un session sintético con la
 * resolution recién creada.
 */
export async function ensureAdminSession(): Promise<AdminSession | null> {
  const existing = await getAdminSession();
  if (existing) return existing;

  if (!isAuthConfigured()) return null;

  const session = await auth();
  if (!session?.user?.email) return null;

  const userId = (session.user as { id?: string }).id;
  if (!userId) return null;

  const resolved = await createOrgForNewAdmin({
    userId,
    email: session.user.email,
    name: session.user.name,
  });

  return {
    orgId: resolved.orgId,
    email: session.user.email,
    role: resolved.role,
    name: session.user.name,
    image: session.user.image,
  };
}

export type AuthedUser = {
  userId: string;
  email: string;
  name?: string | null;
  image?: string | null;
  /** Org actual si ya existe membership, null si todavía no se onboardeó. */
  orgId: string | null;
};

/**
 * Devuelve el user logueado vía Google sin requerir orgId. Útil para los
 * call-sites que tienen que decidir qué hacer con un user sin org (ej.
 * /admin/* hace onboarding, /cli/connect aplica join-via-org-id o rechaza).
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  if (!isAuthConfigured()) return null;

  const session = await auth();
  if (!session?.user?.email) return null;

  const userId = (session.user as { id?: string }).id;
  if (!userId) return null;

  return {
    userId,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    orgId: session.user.orgId ?? null,
  };
}
