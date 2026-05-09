import Link from "next/link";
import { ActionBadge, CodePanel, MetricStrip } from "@/components/data";
import { ThemeToggle } from "@/components/layout";
import { FeatureCard, HeroSection, Timeline } from "@/components/marketing";
import { Button, Card, CardContent } from "@/components/ui";

const team = [
  { name: "Christian Rojas Rodriguez", github: "@Christian-Rojas-Rodriguez" },
  { name: "Federico Hörl", github: "@fede-h" },
  { name: "Mauricio Genta", github: "@5y5F4il" },
  { name: "Jaime Aza", github: "@Jjat00" },
  { name: "Tomás Leonel Degese", github: "@tomileonel" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="font-semibold tracking-tight">
            Guardrail
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#problema" className="hover:text-foreground">Problema</a>
            <a href="#flujo" className="hover:text-foreground">Flujo</a>
            <a href="#about" className="hover:text-foreground">About us</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChildShim className="hidden sm:inline-flex">
              <Link href="/admin/login">Log in demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <HeroSection
          eyebrow="Platanus Hack 26 · AI Security"
          title="El firewall de Claude Code que tu compliance officer va a aprobar."
          description="Reglas no-code, redacción en runtime y auditoría clara. Tus devs siguen usando Claude Code; vos decidís qué sale del perímetro corporativo."
          actions={
            <>
              <Button asChildShim size="lg">
                <Link href="/admin/login">Entrar al dashboard</Link>
              </Button>
              <Button asChildShim variant="secondary" size="lg">
                <a href="#flujo">Ver cómo funciona</a>
              </Button>
            </>
          }
          visual={
            <Card className="overflow-hidden">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between rounded-xl bg-muted p-3">
                  <span className="text-sm font-medium">Request entrante</span>
                  <ActionBadge action="BLOCK" />
                </div>
                <CodePanel
                  code={`prompt: "Acá va mi AWS_SECRET_ACCESS_KEY..."
policy: "Bloquear credenciales"
decision: "BLOCKED"
reason: "Detectamos un secreto antes de enviarlo al modelo"`}
                />
                <MetricStrip
                  metrics={[
                    { label: "Overhead", value: "<200ms" },
                    { label: "Acciones", value: "4" },
                    { label: "Admin", value: "No-code" },
                    { label: "Audit", value: "100%" },
                  ]}
                />
              </CardContent>
            </Card>
          }
        />

        <section id="problema" className="py-16">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">El problema</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Los prompts también son superficie de fuga.</h2>
            <p className="mt-4 text-muted-foreground">
              Sin un interceptor, credenciales, nombres de clientes, paths internos o pedidos fuera de rol pueden salir del perímetro corporativo sin evidencia auditable.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard title="Leak de credencial" description="Un dev pega una API key o secreto en Claude Code. Guardrail lo bloquea antes del upstream." />
            <FeatureCard title="Cliente real en prompt" description="Una política de negocio redacta nombres sensibles y deja pasar el resto del contexto." />
            <FeatureCard title="Pedido fuera de rol" description="La empresa define qué acciones puede pedir cada perfil sin tocar las máquinas de los devs." />
          </div>
        </section>

        <section id="flujo" className="grid gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Flujo de demo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Del login al dashboard en un click.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              La landing vende el producto, el login demo abre el backoffice y el dashboard muestra cómo van las peticiones: bloqueadas, aceptadas y políticas activas.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChildShim>
                <Link href="/admin/login">Log in</Link>
              </Button>
              <Button asChildShim variant="secondary">
                <Link href="/admin/dashboard">Ir directo al dashboard</Link>
              </Button>
            </div>
          </div>
          <Timeline
            items={[
              { title: "Claude Code", description: "El usuario manda un prompt como siempre." },
              { title: "Interceptor", description: "La cascada Regex -> Pattern -> Haiku decide BLOCK, REDACT, WARN o LOG." },
              { title: "Dashboard", description: "Compliance ve peticiones aceptadas/bloqueadas y motivos en tiempo real." },
              { title: "Admin", description: "Desde Policies puede agregar, modificar, activar o sacar reglas una por una." },
            ]}
          />
        </section>

        <section className="py-16">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard title="Layer 1" description="Claude Code en la máquina del dev." />
            <FeatureCard title="Layer 2" description="Proxy interceptor compatible con políticas de runtime." />
            <FeatureCard title="Layer 3" description="Admin no-code para reglas, dashboard e interacciones." />
            <FeatureCard title="Layer 4" description="AI Suggestor para proponer nuevas reglas desde logs." />
          </div>
        </section>

        <section id="about" className="py-16">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">About us</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Team 22 · Buenos Aires.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Construimos una plataforma de enforcement de políticas de seguridad de datos para asistentes AI corporativos, focalizada en Claude Code y pensada para empresas LATAM.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {team.map((member) => (
              <Card key={member.github}>
                <CardContent className="pt-6">
                  <div className="font-semibold leading-6">{member.name}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{member.github}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Ver el producto funcionando.</h2>
                <p className="mt-2 opacity-85">Entrá al login demo y pasá al dashboard para administrar políticas.</p>
              </div>
              <Button asChildShim variant="secondary" size="lg">
                <Link href="/admin/login">Log in demo</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
