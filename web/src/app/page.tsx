// `//` is a deliberate visual token from the design system (see
// identidad/design.md § 3, "Comments tipo código"), not stray JS comments.
/* eslint-disable react/jsx-no-comment-textnodes */
import Link from "next/link";
import { WaveTerrain } from "@/components/wave-terrain";

const TEAM = [
  { name: "Christian Rojas Rodriguez", gh: "Christian-Rojas-Rodriguez" },
  { name: "Federico Hörl", gh: "fede-h" },
  { name: "Mauricio Genta", gh: "5y5F4il" },
  { name: "Jaime Aza", gh: "Jjat00" },
  { name: "Tomás Leonel Degese", gh: "tomileonel" },
];

const REPO_URL = "https://github.com/platanus-hack/platanus-hack-26-ar-team-22";

type Action = "LOG" | "WARN" | "REDACT" | "BLOCK";

export default function HomePage() {
  return (
    <main className="flex flex-col overflow-x-clip">
      <SiteHeader />
      <Hero />
      <DemoSection />
      <ProblemSection />
      <HowItWorksSection />
      <TraceSection />
      <WhyLatamSection />
      <ManifestoSection />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Header / wordmark
// ---------------------------------------------------------------------------

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-graphite-dark/15 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Wordmark />
        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wide text-graphite md:flex">
          <a href="#problema" className="transition-colors hover:text-ink">
            // problema
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-ink">
            // cómo funciona
          </a>
          <a href="#trace" className="transition-colors hover:text-ink">
            // trace
          </a>
          <a href="#latam" className="transition-colors hover:text-ink">
            // latam
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href={REPO_URL}
            className="hidden font-mono text-xs text-ink underline underline-offset-4 transition-colors hover:text-graphite md:inline"
          >
            github →
          </Link>
          <Link
            href="/admin?demo=1"
            className="inline-flex items-center bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-graphite-dark"
            style={{ borderRadius: "var(--radius)" }}
          >
            admin demo →
          </Link>
        </div>
      </div>
    </header>
  );
}

function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const wordSize = size === "lg" ? "text-6xl md:text-8xl" : "text-xl";
  const markSize = size === "lg" ? "h-16 w-16 md:h-24 md:w-24" : "h-6 w-6";
  return (
    <Link href="/" className="flex items-center gap-3">
      <TranqueraMark className={markSize} />
      <span
        className={`${wordSize} font-sans font-semibold lowercase tracking-tight text-ink`}
      >
        tranquera
      </span>
    </Link>
  );
}

// Logo construction per identidad/design.md § 4:
//   8u × 6u box, 2 postes (1u × 6u) separated by 2u, 2 travesaños (5u × 1u)
function TranqueraMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 60"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <rect x="20" y="0" width="10" height="60" />
      <rect x="50" y="0" width="10" height="60" />
      <rect x="15" y="12" width="50" height="10" />
      <rect x="15" y="38" width="50" height="10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative isolate w-full overflow-hidden bg-ink text-paper">
      <HeroBackdrop />
      <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-16 md:pb-44 md:pt-24">
        {/* Top meta bar: caption (left) + live status (right). */}
        <div className="rise mb-20 flex flex-wrap items-start justify-between gap-4 md:mb-28">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/55">
            <span aria-hidden className="mr-2 text-paper">
              +
            </span>
            tranquera · operators-first, not bypassed
          </span>
          <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-paper/55 md:inline-flex">
            <span
              aria-hidden
              className="hero-dot block h-1.5 w-1.5 rounded-full bg-paper"
            />
            sistema · v1.0 · live
          </span>
        </div>

        {/* Display headline: wordmark + canonical short tagline, large and
            tight — adapted from FOXTROVE's display rhythm. */}
        <div className="rise" style={{ animationDelay: "120ms" }}>
          <h1 className="text-[clamp(3.5rem,15vw,10.5rem)] font-semibold lowercase leading-[0.92] tracking-[-0.045em] text-paper">
            tranquera.
          </h1>
          <p className="mt-3 text-3xl font-medium leading-[1.05] tracking-[-0.02em] text-paper/75 md:mt-5 md:text-6xl">
            un paso controlado.
          </p>
        </div>

        {/* Subheadline carries the B2B promise. */}
        <p
          className="rise mt-10 max-w-2xl text-lg leading-relaxed text-paper/80 md:text-xl"
          style={{ animationDelay: "240ms" }}
        >
          El firewall de Claude Code que tu compliance officer va a aprobar.
          Reglas no-code, redacción en runtime y auditoría completa.
        </p>

        {/* CTAs */}
        <div
          className="rise mt-10 flex flex-wrap items-center gap-4"
          style={{ animationDelay: "360ms" }}
        >
          <Link
            href="/admin?demo=1"
            className="inline-flex items-center justify-center bg-paper px-7 py-3.5 font-medium text-ink transition-colors hover:bg-paper-soft"
            style={{ borderRadius: "var(--radius)" }}
          >
            Ver el admin demo →
          </Link>
          <Link
            href={REPO_URL}
            className="inline-flex items-center justify-center border border-paper px-7 py-3.5 font-medium text-paper transition-colors hover:bg-paper hover:text-ink"
            style={{ borderRadius: "var(--radius)" }}
          >
            Ver en GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

// Paper-on-ink wireframe that fills the hero. The grid is flat by default
// and only ripples around the cursor — see WaveTerrain for the math.
function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-ink">
      <WaveTerrain className="absolute inset-0 h-full w-full text-paper" />
    </div>
  );
}

// Demo cell shown right after the hero — a sample request running through
// the cascade and exiting as a verdict pill. Lives on paper so it reads as
// a fragment of log lifted out of the dark hero.
function DemoSection() {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pb-20 md:pt-24">
        <DemoStrip />
      </div>
    </section>
  );
}

// Tira inline al pie del hero: una request real entrando, la cascada decidiendo,
// la pill saliendo. Estática, sin JS — lee como un fragmento de log.
function DemoStrip() {
  return (
    <div
      className="rise grid gap-px overflow-hidden border border-graphite-dark/20 bg-graphite-dark/15 md:grid-cols-3"
      style={{ animationDelay: "240ms", borderRadius: "var(--radius)" }}
    >
      <DemoCell label="01 · request">
        <code className="block font-mono text-xs leading-relaxed text-ink md:text-sm">
          $ claude &quot;ayudame con esto: AKIAIOSFODNN7EXAMPLE&quot;
        </code>
      </DemoCell>
      <DemoCell label="02 · cascada">
        <div className="flex flex-col gap-1.5 font-mono text-xs leading-relaxed">
          <span className="text-ink">regex · 4ms · match aws-access-key</span>
          <span className="text-graphite">pattern · skip</span>
          <span className="text-graphite">haiku · skip</span>
        </div>
      </DemoCell>
      <DemoCell label="03 · veredicto">
        <ActionPill action="BLOCK" rule="aws-access-key" />
        <span className="mt-2 block font-mono text-[11px] text-graphite">
          trace · 01HXYZK… · 9ms
        </span>
      </DemoCell>
    </div>
  );
}

function DemoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 bg-paper p-5 md:p-6">
      <span className="font-mono text-[11px] uppercase tracking-wider text-graphite">
        // {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Problema
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
      tag: "01 · credencial",
      title: "Leak de AWS key",
      prompt: "ayudame a debuggear esto: AKIAIOSFODNN7EXAMPLE",
      consequence: "Tu access key sale del perímetro y queda en logs externos.",
      action: "BLOCK",
      rule: "aws-access-key",
    },
    {
      tag: "02 · cliente",
      title: "Mención de cliente real",
      prompt: "escribime un email para Acme Corp explicando el bug",
      consequence: "Datos comerciales identificables salen sin mediación.",
      action: "REDACT",
      rule: "client-name",
    },
    {
      tag: "03 · secreto",
      title: "Paste accidental de .env",
      prompt: "no funciona el .env: DATABASE_URL=postgres://admin:Pa$$…",
      consequence: "Credenciales productivas viajan en un prompt cualquiera.",
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
        <SectionHeading
          tag="el problema"
          title="Tus devs usan Claude Code. Vos no controlás qué pegan en cada prompt."
          subtitle="Sin un punto de control intermedio, cada credencial, nombre de cliente o snippet propietario que el dev tipea va directo a Anthropic. Tranquera se mete entre los dos."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {cases.map((c) => (
            <article
              key={c.tag}
              className="group flex flex-col gap-4 border border-graphite-dark/20 bg-paper p-6 transition-transform hover:-translate-y-0.5"
              style={{ borderRadius: "var(--radius)" }}
            >
              <span className="font-mono text-xs uppercase tracking-wider text-graphite">
                // {c.tag}
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
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Cómo funciona
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
        <SectionHeading
          tag="cómo funciona"
          title="Cuatro capas. Una sola tranquera entre Claude Code y Anthropic."
        />

        <div className="mb-16 flex flex-col gap-2">
          {layers.map((layer) => (
            <div
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
            </div>
          ))}
        </div>

        <Cascade />
        <ActionsLegend />
      </div>
    </section>
  );
}

function Cascade() {
  const steps = [
    {
      n: "1",
      name: "Regex",
      latency: "~5 ms",
      example: "emails · tarjetas · AWS keys · JWTs",
    },
    {
      n: "2",
      name: "Pattern",
      latency: "~20 ms",
      example: ".env · id_rsa · *.pem · paths internos",
    },
    {
      n: "3",
      name: "Haiku judge",
      latency: "~150 ms",
      example: "reglas en lenguaje natural · contexto",
    },
  ];

  return (
    <div
      className="border border-graphite-dark/20 p-6 md:p-10"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <span className="font-mono text-xs uppercase tracking-wider text-graphite">
          // cascada de detección
        </span>
        <span className="font-mono text-xs uppercase tracking-wider text-ink">
          presupuesto · &lt; 200 ms p95
        </span>
      </div>
      <div className="grid items-stretch gap-px bg-graphite-dark/15 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <CascadeCell {...steps[0]} />
        <Arrow />
        <CascadeCell {...steps[1]} />
        <Arrow />
        <CascadeCell {...steps[2]} />
      </div>
      <p className="mt-6 max-w-3xl font-mono text-xs leading-relaxed text-graphite">
        // si una capa más barata ya decidió, no se llama a la siguiente. Costo y
        latencia importan.
      </p>
    </div>
  );
}

function CascadeCell({
  n,
  name,
  latency,
  example,
}: {
  n: string;
  name: string;
  latency: string;
  example: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-paper p-5">
      <div className="flex items-baseline gap-3 font-mono text-sm">
        <span className="text-graphite">capa {n}</span>
        <span className="text-base font-medium text-ink">{name}</span>
      </div>
      <span className="font-mono text-sm text-graphite-dark">{latency}</span>
      <p className="font-mono text-xs leading-relaxed text-graphite-dark">
        {example}
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center bg-paper px-2 py-2 font-mono text-graphite md:px-3">
      <span aria-hidden>→</span>
      <span className="sr-only">luego</span>
    </div>
  );
}

function ActionsLegend() {
  return (
    <div className="mt-12 grid gap-4 md:grid-cols-4">
      <ActionRow
        action="LOG"
        title="Solo registra"
        desc="Baseline. Útil antes de promover una regla a más estricta."
      />
      <ActionRow
        action="WARN"
        title="Pasa pero notifica"
        desc="Patrones sospechosos no críticos. El admin se entera."
      />
      <ActionRow
        action="REDACT"
        title="Reemplaza y reenvía"
        desc="Nombres, paths internos, snippets propietarios."
      />
      <ActionRow
        action="BLOCK"
        title="Devuelve mensaje sintético"
        desc="PII crítica, credenciales, info regulada."
      />
    </div>
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
    <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
      <ActionPill action={action} />
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="text-sm leading-relaxed text-graphite-dark">{desc}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trace card — lo que ve el dev cuando hay BLOCK
// ---------------------------------------------------------------------------

function TraceSection() {
  return (
    <section id="trace" className="w-full border-y border-graphite-dark/15">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <SectionHeading
          tag="trace"
          title="Cada decisión es auditable. El dev ve por qué."
          subtitle="Devolver un Message sintético en vez de un 403 no es casualidad. Claude Code lo muestra como respuesta del modelo y el dev entiende qué pasó sin ver un error de red."
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <TraceCard
            label="// request entrante"
            theme="light"
            body={
              <>
                <KvLine k="POST" v="/v1/messages" />
                <KvLine k="x-api-key" v="sk-ant-…" />
                <KvLine k="anthropic-version" v="2023-06-01" />
                <div className="mt-4 break-words bg-paper-soft/60 p-3 font-mono text-xs leading-relaxed text-ink">
                  {`{ "model": "claude-sonnet-4-6",
  "messages": [{
    "role": "user",
    "content": "ayudame con AKIAIOSFODNN7EXAMPLE"
  }] }`}
                </div>
              </>
            }
          />
          <TraceCard
            label="// respuesta sintética · BLOCK"
            theme="dark"
            body={
              <>
                <KvLine k="x-team22-trace-id" v="01HXYZK…" theme="dark" />
                <KvLine k="x-team22-action" v="BLOCK" theme="dark" />
                <KvLine k="stop_reason" v="team22_blocked" theme="dark" />
                <div className="mt-4 break-words border border-graphite-dark p-3 font-mono text-xs leading-relaxed text-paper">
                  Tu request fue bloqueado por la política{" "}
                  <span className="text-paper underline underline-offset-2">
                    aws-access-key
                  </span>
                  . Detectamos un patrón de AWS Secret Access Key. Si necesitás
                  trabajar con credenciales reales, abrí un ticket con tu admin.
                </div>
                <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-graphite">
                  <span>// total · 9ms</span>
                  <span className="hairline h-3 w-px" />
                  <span>// upstream · skipped</span>
                </div>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}

function TraceCard({
  label,
  theme,
  body,
}: {
  label: string;
  theme: "light" | "dark";
  body: React.ReactNode;
}) {
  const base =
    theme === "dark"
      ? "bg-ink text-paper border border-graphite-dark"
      : "bg-paper text-ink border border-graphite-dark/20";
  return (
    <article
      className={`flex flex-col gap-4 p-6 md:p-8 ${base}`}
      style={{ borderRadius: "var(--radius)" }}
    >
      <span
        className={`font-mono text-xs uppercase tracking-wider ${
          theme === "dark" ? "text-graphite" : "text-graphite"
        }`}
      >
        {label}
      </span>
      <div className="flex flex-col gap-2">{body}</div>
    </article>
  );
}

function KvLine({
  k,
  v,
  theme = "light",
}: {
  k: string;
  v: string;
  theme?: "light" | "dark";
}) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-xs leading-relaxed">
      <span className="text-graphite">{k}</span>
      <span className={theme === "dark" ? "text-paper" : "text-ink"}>{v}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Por qué LATAM
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
        <SectionHeading
          tag="por qué latam, ahora"
          title="Cinco países, cinco leyes risk-based en simultáneo."
          subtitle="Toda empresa con LLM en producción va a necesitar evidencia auditable. La pregunta no es si — es contra qué framework demostrarlo primero."
          dark
        />
        <div className="grid gap-6 md:grid-cols-3">
          {sources.map((s) => (
            <article
              key={s.country}
              className="flex flex-col gap-3 border border-paper/15 p-6 transition-colors hover:border-paper/35"
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
          ))}
        </div>
        <div
          className="mt-12 flex flex-col gap-3 border-l-2 border-paper/30 pl-6"
          style={{ borderRadius: "var(--radius)" }}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-graphite">
            // gap multilingüe
          </span>
          <p className="max-w-3xl text-base leading-relaxed text-paper/80">
            XL-SafetyBench, el benchmark de referencia para safety multilingüe,
            no incluye portugués ni países latinoamericanos. La literatura
            académica de safety es &gt;&nbsp;90&nbsp;%&nbsp;inglés. Construir
            desde acá no es ventaja: es necesidad.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Manifiesto
// ---------------------------------------------------------------------------

function ManifestoSection() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="mb-14 flex flex-col items-center gap-6 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-graphite">
            // manifiesto
          </span>
          <p className="max-w-3xl text-2xl font-medium leading-snug md:text-3xl">
            No es un escudo. No es una advertencia. Es una{" "}
            <em className="not-italic underline decoration-graphite underline-offset-[10px]">
              aduana silenciosa
            </em>{" "}
            que aplica las reglas de la empresa sin interrumpir el ritmo de
            quien escribe.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          <Principle
            n="01"
            title="Preciso"
            body="Reglas explícitas, decisiones reproducibles. Cada veredicto se puede explicar con su trace."
          />
          <Principle
            n="02"
            title="Silencioso"
            body="No interrumpe al usuario que tiene buena intención. La fricción es proporcional al riesgo, nunca al ruido."
          />
          <Principle
            n="03"
            title="Permanente"
            body="No es un experimento ni un toggle. Es infraestructura: siempre encendida, siempre auditable."
          />
        </div>
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
    <div className="flex flex-col gap-3 border-t-2 border-ink pt-5">
      <span className="font-mono text-sm text-graphite">{n} ·</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-graphite-dark">{body}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CTA final
// ---------------------------------------------------------------------------

function FinalCta() {
  return (
    <section className="w-full border-t border-graphite-dark/15 bg-paper-soft/40">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between md:py-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-graphite">
            // siguiente paso
          </span>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight md:text-4xl">
            Mirá el admin demo. Tres clicks, una regla nueva, eventos en vivo.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin?demo=1"
            className="inline-flex items-center justify-center bg-ink px-7 py-3.5 font-medium text-paper transition-colors hover:bg-graphite-dark"
            style={{ borderRadius: "var(--radius)" }}
          >
            Entrar al admin →
          </Link>
          <Link
            href={REPO_URL}
            className="inline-flex items-center justify-center border border-ink px-7 py-3.5 font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
            style={{ borderRadius: "var(--radius)" }}
          >
            Repositorio
          </Link>
        </div>
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
              Tranquera intercepta cada prompt antes de que el modelo responda.
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
          <Link href={REPO_URL} className="transition-colors hover:text-ink">
            github →
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Section heading + ActionPill (atoms)
// ---------------------------------------------------------------------------

function SectionHeading({
  tag,
  title,
  subtitle,
  dark = false,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-12 flex max-w-3xl flex-col gap-4">
      <span
        className={`font-mono text-xs uppercase tracking-wider ${
          dark ? "text-graphite" : "text-graphite"
        }`}
      >
        // {tag}
      </span>
      <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`max-w-2xl text-base leading-relaxed md:text-lg ${
            dark ? "text-paper/75" : "text-graphite-dark"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

// Action pill — pesos por severidad según identidad/design.md § 6.
//   LOG 400 · WARN 500 · REDACT 600 · BLOCK 700
// La marca es monocroma (sin colores de status). Las superficies de
// monitoreo en vivo (/admin/events) sí pueden sumar acento funcional;
// la landing se queda en la paleta paper/ink/graphite.
function ActionPill({ action, rule }: { action: Action; rule?: string }) {
  const weight: Record<Action, string> = {
    LOG: "font-normal",
    WARN: "font-medium",
    REDACT: "font-semibold",
    BLOCK: "font-bold",
  };
  const indicator: Record<Action, string> = {
    LOG: "bg-graphite",
    WARN: "bg-graphite-dark",
    REDACT: "bg-ink/80",
    BLOCK: "bg-ink",
  };
  return (
    <div className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-wider">
      <span
        aria-hidden
        className={`h-4 w-1 ${indicator[action]}`}
      />
      <span className={`text-ink ${weight[action]}`}>{action}</span>
      {rule ? (
        <span className="text-graphite normal-case">
          → rule.id ={" "}
          <span className="text-ink">&quot;{rule}&quot;</span>
        </span>
      ) : null}
    </div>
  );
}
