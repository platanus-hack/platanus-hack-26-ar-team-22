// Next.js 16 renamed Middleware → Proxy. Same lifecycle, runs before each
// matched request.
//
// Modo híbrido:
//   - Si GOOGLE_CLIENT_ID está seteado → gateá con Auth.js (JWT cookie).
//   - Si no → el shortcut `?demo=1` solo queda activo fuera de production,
//     o con ALLOW_DEMO_ADMIN=1.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { isDemoAdminModeEnabled, isGoogleAuthConfigured } from "@/lib/auth-mode";

const ADMIN_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d
const AUTH_LOGIN = "/admin/login";

// Edge-safe instance: solo lee la cookie JWT, no toca DB.
const { auth } = NextAuth(authConfig);

const useGoogleAuth = isGoogleAuthConfigured();
const useDemoAuth = isDemoAdminModeEnabled();

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

  if (!useDemoAuth) {
    if (isPublicAdmin) return NextResponse.next();
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const login = request.nextUrl.clone();
    login.pathname = AUTH_LOGIN;
    login.search = "";
    return NextResponse.redirect(login);
  }

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
      secure: process.env.NODE_ENV === "production",
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
