import type { ReactNode } from "react";

export function HeroSection({ eyebrow, title, description, actions, visual }: { eyebrow?: string; title: string; description: string; actions?: ReactNode; visual?: ReactNode }) {
  return (
    <section className="grid min-h-[680px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
      <div>
        {eyebrow ? <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p> : null}
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-foreground md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {visual ? <div>{visual}</div> : null}
    </section>
  );
}
