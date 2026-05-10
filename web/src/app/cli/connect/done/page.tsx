// Vista post-aprobación. El CLI ya tiene (o va a tener en el próximo poll)
// el token. Animamos la tranquera "cerrándose" como cierre simbólico del
// flujo de auth, y le damos al dev una verificación copy-paste.
/* eslint-disable react/jsx-no-comment-textnodes */

import Link from "next/link";

import { CelebrationMark } from "./_celebration";

export default function CliConnectDonePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
        <div
          className="flex w-full flex-col items-start gap-7 border border-graphite-dark/20 bg-paper p-8 md:p-10"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div className="flex w-full items-start justify-between gap-4">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink">
              <span aria-hidden className="h-3 w-1 bg-ink" />
              // ok · vinculado
            </span>
            <CelebrationMark className="h-12 w-12 text-ink" />
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Tu CLI quedó vinculado.
            </h1>
            <p className="text-sm leading-relaxed text-graphite-dark">
              Volvé a la terminal — el comando{" "}
              <code className="font-mono text-ink">npx tranquera setup</code>{" "}
              ya recibió tu token y terminó. Podés cerrar esta pestaña.
            </p>
          </div>

          <div
            className="flex w-full flex-col gap-2 border border-graphite-dark/20 bg-paper-soft/50 p-4"
            style={{ borderRadius: "var(--radius)" }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-graphite">
              // verificá la sesión
            </span>
            <code className="font-mono text-sm text-ink">
              $ npx tranquera whoami
            </code>
          </div>

          <p className="font-mono text-[11px] leading-relaxed text-graphite">
            // si vas a vincular otra máquina, corré npx tranquera setup desde
            allá. cada device es independiente.
          </p>

          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline underline-offset-4 transition-colors hover:text-graphite-dark"
          >
            ← volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
