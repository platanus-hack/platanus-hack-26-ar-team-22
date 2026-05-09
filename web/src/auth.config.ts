// Edge-safe NextAuth config. Sin adapter de DB — el adapter usa Prisma y
// el runtime de Next.js middleware/proxy todavía no soporta nuestro driver.
// El config completo (con adapter) vive en src/auth.ts y lo usan los API
// route handlers + server components.
//
// Auth.js v5 requiere este split para que `proxy.ts` pueda ejecutar
// `auth()` sin levantar Prisma. Ver https://authjs.dev/guides/edge-compatibility.

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Pedimos profile básico — email + nombre + avatar. Usamos el email
      // para resolver org en fase 2 (matcheo por dominio).
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  // JWT en sesión nos deja chequear auth en proxy.ts sin abrir conexión a DB.
  // Los users sí se guardan en DB vía el adapter (auth.ts).
  session: { strategy: "jwt" },
  callbacks: {
    // Por ahora solo decide si la ruta requiere login. La resolución de org
    // (fase 2) se conecta acá vía el callback `signIn`.
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      // /admin/login es público — sino el redirect a login se redirige
      // a sí mismo (ERR_TOO_MANY_REDIRECTS).
      const isPublicAdmin = path === "/admin/login" || path.startsWith("/admin/login/");
      const isAdminPath = path.startsWith("/admin") || path.startsWith("/api/admin");
      if (!isAdminPath || isPublicAdmin) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
