// Next.js 16 renamed Middleware → Proxy. Same lifecycle, runs before each
// matched request. Used here only to gate `/admin/*` and `/api/admin/*` and to
// honour the `?demo=1` shortcut from the landing CTAs.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const wantsDemo = searchParams.get("demo") === "1";

  // `?demo=1` → set the cookie, drop the query param, land on /admin/events.
  if (wantsDemo) {
    const next = request.nextUrl.clone();
    next.searchParams.delete("demo");
    if (pathname === "/admin" || pathname === "/admin/") {
      next.pathname = "/admin/events";
    }
    const response = NextResponse.redirect(next);
    response.cookies.set(ADMIN_COOKIE, "demo", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  // No demo flag → require the cookie. Same gate for pages and API.
  const hasSession = request.cookies.get(ADMIN_COOKIE)?.value === "demo";
  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
