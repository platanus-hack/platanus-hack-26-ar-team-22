// NextAuth completo, con adapter Prisma. Lo importan los Route Handlers, los
// Server Components y cualquier cosa que NO sea el proxy/middleware.
// El proxy importa src/auth.config.ts directo (edge-safe, sin adapter).

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});

// Helper para detectar si Auth.js está realmente configurado.
// Si no hay GOOGLE_CLIENT_ID, el proxy cae al bypass de cookie demo.
export function isAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
