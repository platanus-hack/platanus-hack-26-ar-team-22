// Admin shell. Sidebar + header + main slot. Server component — the proxy
// (src/proxy.ts) has already gated access by the time we render here.
/* eslint-disable react/jsx-no-comment-textnodes */
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-session";
import { AdminNav } from "./_components/nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const email = session?.email ?? "—";

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
            <span>// org · demo</span>
            <span className="hidden md:inline">// {email}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-10 md:py-14">
        <aside className="w-44 shrink-0">
          <AdminNav />
          <p className="mt-10 font-mono text-[11px] leading-relaxed text-graphite">
            // demo session
            <br />
            // single tenant · org=demo
          </p>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
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
