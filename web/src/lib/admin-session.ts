// Resolver de la session del admin. Funciona en dos modos:
//
//   1. Google Auth (si GOOGLE_CLIENT_ID está configurado): devuelve la
//      session real de Auth.js. Fase 2 va a resolver el `orgId` mirando
//      el email del user contra members + organizations.
//
//   2. Demo bypass (sin Google config): devuelve la mock session si la
//      cookie `admin_session=demo` está presente. Mantiene la demo del
//      pitch funcionando sin tener que loguear.
//
// Las dos formas devuelven el mismo shape, así que los callers no se
// enteran del modo.

import { cookies } from "next/headers";
import { auth, isAuthConfigured } from "@/auth";

export const ADMIN_COOKIE = "admin_session";
export const DEMO_ORG_ID = "demo";

export type AdminSession = {
  orgId: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

const DEMO_SESSION: AdminSession = {
  orgId: DEMO_ORG_ID,
  email: "admin@team22.dev",
};

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isAuthConfigured()) {
    const session = await auth();
    if (!session?.user?.email) return null;
    return {
      // Fase 2: resolver orgId real desde members.email → org.
      // Por ahora, todos quedan en `demo` hasta que esa fase se cierre.
      orgId: DEMO_ORG_ID,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    };
  }

  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  if (value !== "demo") return null;
  return DEMO_SESSION;
}
