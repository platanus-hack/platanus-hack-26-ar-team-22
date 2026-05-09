// /admin/events — feed live de interactions del proxy.
/* eslint-disable react/jsx-no-comment-textnodes */
import { getAdminSession } from "@/lib/admin-session";
import { toEventDTO } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { EventsFeed } from "./_components/events-feed";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const session = await getAdminSession();
  if (!session) return null;

  const rows = await prisma.interaction.findMany({
    where: { orgId: session.orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const initialEvents = rows.map(toEventDTO);

  return (
    <section>
      <header className="mb-8 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // eventos
        </span>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Lo que pasa en tiempo real.
        </h1>
        <p className="max-w-2xl text-graphite-dark">
          Cada request de Claude Code que pasa por el proxy. Polling cada 3 s,
          sin reload.
        </p>
      </header>
      <EventsFeed initialEvents={initialEvents} />
    </section>
  );
}
