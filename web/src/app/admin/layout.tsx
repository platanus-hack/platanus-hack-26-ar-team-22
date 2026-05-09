// Admin shell. Sidebar + header + main slot. Server component — the proxy
// (src/proxy.ts) has already gated access by the time we render here.
/* eslint-disable react/jsx-no-comment-textnodes */
import Link from "next/link";
import { isAuthConfigured, signOut } from "@/auth";
import { ensureAdminSession } from "@/lib/admin-session";
import { AdminNav } from "./_components/nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ensureAdminSession() onboardea al admin (crea org si no existe) en su
  // primer hit a cualquier ruta /admin/*. Es el reemplazo de la rama de
  // auto-create que sacamos de resolveOrgForUser.
  const session = await ensureAdminSession();
  const email = session?.email ?? "—";
  const orgId = session?.orgId ?? "—";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-graphite-dark/15 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <TranqueraMark className="h-6 w-6" />
            <span className="text-xl font-semibold lowercase tracking-tight">
              tranquera
            </span>
            <span className="ml-3 border-l border-graphite-dark/20 pl-3 font-mono text-xs uppercase tracking-wider text-graphite">
              admin
            </span>
          </Link>
          <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-graphite">
            <span>// org · {orgId}</span>
            <span className="hidden md:inline">// {email}</span>
            {isAuthConfigured() ? <SignOutButton /> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-10 md:py-14">
        <aside className="w-44 shrink-0">
          <AdminNav />
          <p className="mt-10 font-mono text-[11px] leading-relaxed text-graphite">
            // org · {orgId}
            <br />
            // {isAuthConfigured() ? "google session" : "demo session"}
          </p>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="border border-graphite-dark/30 px-2 py-1 transition-colors hover:border-ink hover:text-ink"
        style={{ borderRadius: "var(--radius)" }}
      >
        salir
      </button>
    </form>
  );
}

// Small inline copy of the landing wordmark so the admin shell stays
// self-contained — extracting would mean touching the landing file too.
function TranqueraMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 60" fill="currentColor" aria-hidden className={className}>
      <rect x="20" y="0" width="10" height="60" />
      <rect x="50" y="0" width="10" height="60" />
      <rect x="15" y="12" width="50" height="10" />
      <rect x="15" y="38" width="50" height="10" />
    </svg>
  );
}
