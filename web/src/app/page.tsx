// `//` is a deliberate visual token from the design system (see
// identidad/design.md § 3, "Comments tipo código"), not stray JS comments.
/* eslint-disable react/jsx-no-comment-textnodes */
import {
  ActionPill,
  Button,
  SectionHeading,
  type Action,
} from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

import { CascadeDemo } from "./_components/cascade-demo";
import { Hero } from "./_components/hero";
import { SiteHeader, Wordmark } from "./_components/site-header";
import { TraceDemo } from "./_components/trace-demo";

const TEAM = [
  { name: "Christian Rojas Rodriguez", gh: "Christian-Rojas-Rodriguez" },
  { name: "Federico Hörl", gh: "fede-h" },
  { name: "Mauricio Genta", gh: "5y5F4il" },
  { name: "Jaime Aza", gh: "Jjat00" },
  { name: "Tomás Leonel Degese", gh: "tomileonel" },
];

const REPO_URL = "https://github.com/platanus-hack/platanus-hack-26-ar-team-22";

export default function HomePage() {
  return (
    <main className="flex flex-col overflow-x-clip">
      <SiteHeader />
      <Hero />
      <DemoSection />
      <ProblemSection />
      <HowItWorksSection />
      <InstallSection />
      <TraceSection />
      <WhyLatamSection />
      <ManifestoSection />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Demo bridge — a real request flowing through the cascade right under the
// hero. Lives on paper so it reads as a fragment of log lifted out of the
// dark hero. Sequential reveal makes the three cells feel like a flow.
// ---------------------------------------------------------------------------

function DemoSection() {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pb-20 md:pt-24">
        <Stagger
          gap={0.12}
          className="grid gap-px overflow-hidden border border-graphite-dark/20 bg-graphite-dark/15 md:grid-cols-3"
        >
          <StaggerItem>
            <DemoCell label="01 · request">
              <code className="block font-mono text-xs leading-relaxed text-ink md:text-sm">
                $ claude &quot;ayudame con esto: AKIAIOSFODNN7EXAMPLE&quot;
              </code>
            </DemoCell>
          </StaggerItem>
          <StaggerItem>
            <DemoCell label="02 · cascada">
              <div className="flex flex-col gap-1.5 font-mono text-xs leading-relaxed">
                <span className="text-ink">regex · 4ms · match aws-access-key</span>
                <span className="text-graphite">pattern · skip</span>
                <span className="text-graphite">haiku · skip</span>
              </div>
            </DemoCell>
          </StaggerItem>
          <StaggerItem>
            <DemoCell label="03 · veredicto">
              <ActionPill action="BLOCK" rule="aws-access-key" />
              <span className="mt-2 block font-mono text-[11px] text-graphite">
                trace · 01HXYZK… · 9ms
              </span>
            </DemoCell>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

function DemoCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-3 bg-paper p-5 md:p-6">
      <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
        // {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// [01] El problema — three concrete misalignments. Stagger the cards so the
// section reads as a sequence, not three identical tiles.
// ---------------------------------------------------------------------------

type ProblemCase = {
  tag: string;
  title: string;
  prompt: string;
  consequence: string;
  action: Action;
  rule: string;
};

function ProblemSection() {
  const cases: ProblemCase[] = [
    {
      tag: "credencial",
      title: "Leak de AWS key",
      prompt: "ayudame a debuggear esto: AKIAIOSFODNN7EXAMPLE",
      consequence:
        "El dev no sabe que esto viola la política de credenciales. Tranquera lo detecta antes de que llegue al modelo.",
      action: "BLOCK",
      rule: "aws-access-key",
    },
    {
      tag: "cliente",
      title: "Mención de cliente real",
      prompt: "escribime un email para Acme Corp explicando el bug",
      consequence:
        "El dev no tenía forma de saber que mencionar ese cliente estaba fuera de policy. Tranquera lo señala.",
      action: "REDACT",
      rule: "client-name",
    },
    {
      tag: "secreto",
      title: "Paste accidental de .env",
      prompt: "no funciona el .env: DATABASE_URL=postgres://admin:Pa$$…",
      consequence:
        "Un paste accidental que el dev no notó. Tranquera alinea la intención con la política antes de que llegue a Anthropic.",
      action: "BLOCK",
      rule: "dotenv-paste",
    },
  ];

  return (
    <section
      id="problema"
      className="w-full border-y border-graphite-dark/15 bg-paper-soft/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <SectionHeading
            index="01"
            tag="el problema"
            title="Tus devs usan Claude Code. Sin contexto de las políticas de la org, cualquier prompt puede estar desalineado sin que nadie lo sepa."
            subtitle="Sin un punto de alineamiento intermedio, el dev opera a ciegas respecto de las políticas de la org. Tranquera registra el desvío, informa al dev y mantiene trazabilidad completa."
          />
        </Reveal>
        <Stagger gap={0.12} className="grid gap-6 md:grid-cols-3">
          {cases.map((c, i) => (
            <StaggerItem key={c.tag}>
              <article
                className="group relative flex h-full flex-col gap-4 border border-graphite-dark/20 bg-paper p-6 transition-transform hover:-translate-y-0.5"
                style={{ borderRadius: "var(--radius)" }}
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-1 ${
                    c.action === "BLOCK"
                      ? "bg-ink"
                      : c.action === "REDACT"
                        ? "bg-ink/75"
                        : "bg-graphite-dark"
                  }`}
                />
                <span className="font-mono text-xs uppercase tracking-wider text-graphite">
                  // 0{i + 1} · {c.tag}
                </span>
                <h3 className="text-xl font-semibold">{c.title}</h3>
                <pre className="whitespace-pre-wrap break-words bg-paper-soft/60 p-3 font-mono text-xs leading-relaxed text-ink">
                  $ claude &quot;{c.prompt}&quot;
                </pre>
                <p className="text-sm leading-relaxed text-graphite-dark">
                  {c.consequence}
                </p>
                <div className="mt-auto pt-2">
                  <ActionPill action={c.action} rule={c.rule} />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// [02] Cómo funciona — four layers + cascada. The cascade is the heart of
// the product; F1-B replaces this static block with an interactive demo.
// ---------------------------------------------------------------------------

function HowItWorksSection() {
  const layers = [
    {
      n: "01",
      name: "Claude Code (cliente)",
      desc: "El dev sigue usando Claude Code igual. Solo configura ANTHROPIC_BASE_URL apuntando al proxy.",
    },
    {
      n: "02",
      name: "Interceptor — proxy modificable",
      desc: "Cada request pasa por una cascada de tres capas con menos de 200 ms de overhead total.",
    },
    {
      n: "03",
      name: "Admin Backoffice (no-code)",
      desc: "Compliance officers crean reglas con un visual builder. Nadie escribe regex a mano.",
    },
    {
      n: "04",
      name: "AI Suggestor",
      desc: "Después de N días, propone reglas nuevas con preview de matches. El admin aprueba con un click.",
    },
  ];

  return (
    <section id="como-funciona" className="w-full">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <SectionHeading
            index="02"
            tag="cómo funciona"
            title="Cuatro capas. Una sola tranquera entre Claude Code y Anthropic."
          />
        </Reveal>

        <Stagger gap={0.08} className="mb-16 flex flex-col gap-2">
          {layers.map((layer) => (
            <StaggerItem
              key={layer.n}
              className="grid grid-cols-[auto_1fr] items-baseline gap-x-8 gap-y-2 border-l-2 border-ink py-4 pl-6 md:grid-cols-[7rem_1fr]"
            >
              <span className="font-mono text-sm text-graphite">
                Layer {layer.n}
              </span>
              <h3 className="text-xl font-semibold">{layer.name}</h3>
              <p className="col-start-2 max-w-2xl text-graphite-dark">
                {layer.desc}
              </p>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal>
          <CascadeDemo />
        </Reveal>
        <Reveal delay={0.2}>
          <ActionsLegend />
        </Reveal>
      </div>
    </section>
  );
}

function ActionsLegend() {
  return (
    <Stagger gap={0.08} className="mt-12 grid gap-4 md:grid-cols-4">
      <StaggerItem>
        <ActionRow
          action="LOG"
          title="Solo registra"
          desc="Baseline. Útil antes de promover una regla a más estricta."
        />
      </StaggerItem>
      <StaggerItem>
        <ActionRow
          action="WARN"
          title="Pasa pero notifica"
          desc="Patrones sospechosos no críticos. El admin se entera."
        />
      </StaggerItem>
      <StaggerItem>
        <ActionRow
          action="REDACT"
          title="Reemplaza y reenvía"
          desc="Nombres, paths internos, snippets propietarios."
        />
      </StaggerItem>
      <StaggerItem>
        <ActionRow
          action="BLOCK"
          title="Devuelve mensaje sintético"
          desc="PII crítica, credenciales, info regulada."
        />
      </StaggerItem>
    </Stagger>
  );
}

function ActionRow({
  action,
  title,
  desc,
}: {
  action: Action;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex h-full flex-col gap-3 border-t-2 border-ink pt-4">
      <ActionPill action={action} />
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="text-sm leading-relaxed text-graphite-dark">{desc}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// [03] Install — what the dev types to start. F1-D will turn the terminal
// into a typewriter and add copy-to-clipboard on the command.
// ---------------------------------------------------------------------------

function InstallSection() {
  return (
    <section id="install" className="w-full bg-paper-soft/40">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <SectionHeading
            index="03"
            tag="instalá tranquera"
            title="Para tu dev, todo se reduce a un comando."
            subtitle="Sin SDK nuevo, sin wrapper, sin re-entrenar a nadie. El admin lo invita por email; el dev se loguea con Google una sola vez. Después, cada prompt de `claude` queda atribuido a su cuenta y pasa por las reglas de la org."
          />
        </Reveal>

        <Reveal delay={0.1}>
          <InstallTerminal />
        </Reveal>

        <Stagger gap={0.1} className="mt-10 grid gap-6 md:grid-cols-3">
          <StaggerItem>
            <InstallStep
              n="01"
              title="Login con Google"
              body="El CLI abre el browser, el dev autoriza con su cuenta. El admin tiene que haberlo agregado antes desde /admin/team."
            />
          </StaggerItem>
          <StaggerItem>
            <InstallStep
              n="02"
              title="ANTHROPIC_BASE_URL al rc"
              body="Variable estándar de Anthropic. Cero invasión: si te arrepentís, npx tranquera logout revoca el token y saca la export del rc. Volvés al estado anterior con un comando."
            />
          </StaggerItem>
          <StaggerItem>
            <InstallStep
              n="03"
              title="Atribución por dev"
              body="El token vinculado al CLI hace que cada request quede asociada al dev correcto en el back-office. El admin ve quién hizo qué."
            />
          </StaggerItem>
        </Stagger>

        <p className="mt-10 max-w-3xl font-mono text-xs leading-relaxed text-graphite">
          // requiere node 18+ (que ya tenés si usás claude code). compatible
          con linux, macos y wsl. el token vive en ~/.tranquera/config.json con
          permisos 0600.
        </p>
      </div>
    </section>
  );
}

function InstallTerminal() {
  return (
    <div
      className="overflow-hidden border border-graphite-dark/20 bg-ink"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-paper/55">
        <span>// terminal</span>
        <span className="hidden md:inline">// onboarding · ~ 30 segundos</span>
      </div>
      <div className="px-6 py-7 font-mono text-sm leading-relaxed text-paper md:px-10 md:py-9 md:text-base">
        <div className="flex items-baseline gap-3">
          <span className="text-paper/45">$</span>
          <span className="text-paper">npx tranquera setup</span>
        </div>
        <pre className="mt-5 whitespace-pre-wrap text-[13px] leading-relaxed text-paper/75 md:text-sm">
          {`  ▎ tranquera · login
  └─ app  https://tranquera.app

  · iniciando device flow…  ok

  Abrí el browser y aprobá:
      https://tranquera.app/cli/connect?code=KXZ2-RZ96

  · esperando aprobación…  ok

  ▎ tranquera · setup
  ├─ proxy   https://proxy.tranquera.app
  ├─ shell   zsh
  ├─ rc      ~/.zshrc
  └─ member  jaime@acme.com · org=acme

  · agregué la export a ~/.zshrc
  · verificando proxy…  ok

  Listo. Reabrí tu terminal y usá Claude Code igual que siempre.`}
        </pre>
      </div>
    </div>
  );
}

function InstallStep({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col gap-2 border-t-2 border-ink pt-4">
      <span className="font-mono text-sm text-graphite">{n} ·</span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-graphite-dark">{body}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// [04] Trace — what the dev sees on BLOCK. F1-C will sequence-reveal the
// two cards with a connector scan-line.
// ---------------------------------------------------------------------------

function TraceSection() {
  return (
    <section id="trace" className="w-full border-y border-graphite-dark/15">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <SectionHeading
            index="04"
            tag="trace"
            title="El dev sabe dónde se desalineó. Cada decisión, explicada."
            subtitle="Devolver un Message sintético en vez de un 403 no es casualidad. El dev entiende qué política aplica y cómo realinearse — sin ver un error de red, sin perder el contexto de trabajo."
          />
        </Reveal>
        <TraceDemo />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// [05] Por qué LATAM
// ---------------------------------------------------------------------------

function WhyLatamSection() {
  const sources = [
    {
      country: "Brasil",
      law: "PL 2338 / 2023",
      detail:
        "Marco risk-based, AIA obligatorio para alto riesgo, supervisión humana mandatoria.",
    },
    {
      country: "Argentina",
      law: "S-0071 / 2025",
      detail:
        "Registro nacional de sistemas IA, impact assessments y clasificación de riesgo.",
    },
    {
      country: "México",
      law: "CONAIA / Ley Federal IA",
      detail:
        "Autorización previa para sistemas de alto riesgo y documentación de safety.",
    },
  ];

  return (
    <section id="latam" className="w-full bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <SectionHeading
            index="05"
            tag="por qué latam, ahora"
            title="Cinco países, cinco leyes risk-based en simultáneo."
            subtitle="Toda empresa con LLM en producción va a necesitar evidencia auditable. La pregunta no es si — es contra qué framework demostrarlo primero."
            dark
          />
        </Reveal>
        <Stagger gap={0.12} className="grid gap-6 md:grid-cols-3">
          {sources.map((s) => (
            <StaggerItem key={s.country}>
              <article
                className="flex h-full flex-col gap-3 border border-paper/15 p-6 transition-colors hover:border-paper/35"
                style={{ borderRadius: "var(--radius)" }}
              >
                <span className="font-mono text-xs uppercase tracking-wider text-graphite">
                  // {s.country.toLowerCase()}
                </span>
                <h3 className="text-lg font-semibold">{s.law}</h3>
                <p className="text-sm leading-relaxed text-paper/75">
                  {s.detail}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal delay={0.15}>
          <div
            className="mt-12 flex flex-col gap-3 border-l-2 border-paper/30 pl-6"
            style={{ borderRadius: "var(--radius)" }}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-graphite">
              // gap multilingüe
            </span>
            <p className="max-w-3xl text-base leading-relaxed text-paper/80">
              XL-SafetyBench, el benchmark de referencia para safety
              multilingüe, no incluye portugués ni países latinoamericanos. La
              literatura académica de safety es &gt;&nbsp;90&nbsp;%&nbsp;inglés.
              Construir desde acá no es ventaja: es necesidad.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// [06] Manifiesto — F1-E adds the underline-draw animation on "alineados".
// ---------------------------------------------------------------------------

function ManifestoSection() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <Reveal>
          <div className="mb-14 flex flex-col items-center gap-6 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-graphite">
              [06] // manifiesto
            </span>
            <p className="max-w-3xl text-2xl font-medium leading-snug md:text-3xl">
              No es vigilancia. No es un escudo. Es el punto donde el dev, la
              org y el modelo quedan{" "}
              <em className="not-italic underline decoration-graphite underline-offset-[10px]">
                alineados
              </em>{" "}
              — sin interrumpir el ritmo de quien escribe.
            </p>
          </div>
        </Reveal>
        <Stagger gap={0.12} className="grid gap-10 md:grid-cols-3">
          <StaggerItem>
            <Principle
              n="01"
              title="Preciso"
              body="Reglas explícitas, decisiones reproducibles. Cada veredicto se puede explicar con su trace."
            />
          </StaggerItem>
          <StaggerItem>
            <Principle
              n="02"
              title="Silencioso"
              body="No interrumpe al usuario que tiene buena intención. La fricción es proporcional al riesgo, nunca al ruido."
            />
          </StaggerItem>
          <StaggerItem>
            <Principle
              n="03"
              title="Permanente"
              body="No es un experimento ni un toggle. Es infraestructura: siempre encendida, siempre auditable."
            />
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}

function Principle({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col gap-3 border-t-2 border-ink pt-5">
      <span className="font-mono text-sm text-graphite">{n} ·</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-graphite-dark">{body}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// [07] CTA final
// ---------------------------------------------------------------------------

function FinalCta() {
  return (
    <section className="w-full border-t border-graphite-dark/15 bg-paper-soft/40">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between md:py-24">
        <Reveal className="flex max-w-2xl flex-col gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-graphite">
            [07] // siguiente paso
          </span>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight md:text-4xl">
            Entrá al admin. Tres clicks, una regla nueva, eventos en vivo.
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="flex flex-wrap items-center gap-4">
          <Button href="/admin/login" variant="solid" tone="ink" size="lg" arrow>
            Entrar al admin
          </Button>
          <Button
            href={REPO_URL}
            external
            variant="outline"
            tone="ink"
            size="lg"
          >
            Repositorio
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-graphite-dark/15">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <Wordmark />
            <p className="max-w-md text-sm leading-relaxed text-graphite-dark">
              Tranquera alinea al dev, la org y el modelo. Un paso controlado
              entre la intención y la respuesta.
            </p>
          </div>
          <p className="max-w-md font-mono text-xs leading-relaxed text-graphite">
            // platanus hack 26 · buenos aires · team 22 · track ai security
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {TEAM.map((t) => (
            <a
              key={t.gh}
              href={`https://github.com/${t.gh}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1"
            >
              <span className="text-sm text-ink transition-colors group-hover:text-graphite-dark">
                {t.name}
              </span>
              <span className="font-mono text-xs text-graphite transition-colors group-hover:text-ink">
                @{t.gh}
              </span>
            </a>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-graphite-dark/15 pt-6 font-mono text-xs text-graphite">
          <span>// sistema · v1.0 · 2026</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            github →
          </a>
        </div>
      </div>
    </footer>
  );
}

