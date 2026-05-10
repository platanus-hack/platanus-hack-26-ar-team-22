// Next.js 16 renamed Middleware → Proxy. Same lifecycle, runs before each
// matched request.
//
// Modo híbrido (mientras Auth.js no esté configurado en prod):
//   - Si GOOGLE_CLIENT_ID está seteado → gateá con Auth.js (JWT cookie).
//   - Si no → mantenemos el shortcut `?demo=1` con cookie mock para no
//     romper la demo del pitch.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const ADMIN_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d
const AUTH_LOGIN = "/admin/login";

// Edge-safe instance: solo lee la cookie JWT, no toca DB.
const { auth } = NextAuth(authConfig);

const useGoogleAuth = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export default auth((request) => {
  const { pathname, searchParams } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isApi = pathname.startsWith("/api/");
  // /admin/login es público — sino el redirect a login se redirige a sí mismo
  // (ERR_TOO_MANY_REDIRECTS).
  const isPublicAdmin = pathname === AUTH_LOGIN || pathname.startsWith("/admin/login/");

  // ----- Modo "Google configurado" -----
  if (useGoogleAuth) {
    if (!isAdminPath || isPublicAdmin) return NextResponse.next();
    if (request.auth) return NextResponse.next();
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const login = request.nextUrl.clone();
    login.pathname = AUTH_LOGIN;
    login.search = "";
    return NextResponse.redirect(login);
  }

  // ----- Modo demo (sin Google) -----
  if (!isAdminPath) return NextResponse.next();

  const wantsDemo = searchParams.get("demo") === "1";
  if (wantsDemo) {
    const next = request.nextUrl.clone();
    next.searchParams.delete("demo");
    // /admin is the dashboard — keep the user there instead of bouncing to /events.
    const response = NextResponse.redirect(next);
    response.cookies.set(ADMIN_COOKIE, "demo", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  const hasDemoCookie = request.cookies.get(ADMIN_COOKIE)?.value === "demo";
  if (!hasDemoCookie) {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
});

export const config = {
  // No incluyo /api/auth porque el handler de NextAuth lo maneja sin gating.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
