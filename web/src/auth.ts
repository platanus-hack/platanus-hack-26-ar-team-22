// NextAuth completo, con adapter Prisma. Lo importan los Route Handlers, los
// Server Components y cualquier cosa que NO sea el proxy/middleware.
// El proxy importa src/auth.config.ts directo (edge-safe, sin adapter).

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "@/auth.config";
import { resolveOrgForUser } from "@/lib/org-resolution";
import { prisma } from "@/lib/prisma";

// Extiendo session.user con los campos que resolvemos al primer login.
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      orgId?: string;
      memberId?: string;
      role?: "admin" | "dev";
    } & DefaultSession["user"];
  }
}

// next-auth/jwt es un re-export de @auth/core/jwt; el augmentation pega
// donde están declaradas realmente las interfaces.
declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    orgId?: string;
    memberId?: string;
    role?: "admin" | "dev";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    // El primer login dispara `user` poblado (el User recién creado por
    // el adapter). Solo resolvemos membership EXISTENTE acá — la creación
    // de org se delega a los call-sites (admin sign-up vive en
    // ensureAdminSession, CLI join vive en /cli/connect).
    //
    // Si no hay membership, el JWT queda con orgId undefined y los
    // call-sites se encargan: admin onboarding lo crea transparente, CLI
    // muestra el error "no perteneces a ninguna org".
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      if (user?.email && user.id && !token.orgId) {
        try {
          const resolved = await resolveOrgForUser({
            userId: user.id,
            email: user.email,
            name: user.name,
          });
          if (resolved) {
            token.orgId = resolved.orgId;
            token.memberId = resolved.memberId;
            token.role = resolved.role;
          }
        } catch (err) {
          console.error("[auth] org resolution failed:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      if (token.orgId) session.user.orgId = token.orgId;
      if (token.memberId) session.user.memberId = token.memberId;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
});

// Helper para detectar si Auth.js está realmente configurado.
// Si no hay GOOGLE_CLIENT_ID, el proxy cae al bypass de cookie demo.
export function isAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
