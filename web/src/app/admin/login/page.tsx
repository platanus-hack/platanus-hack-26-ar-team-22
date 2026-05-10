// Login page del admin. Solo se sirve cuando GOOGLE_CLIENT_ID está
// configurado — sino el proxy nunca redirige acá (cae al cookie demo).
/* eslint-disable react/jsx-no-comment-textnodes */

import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured, signIn } from "@/auth";
import { SiteHeader } from "@/app/_components/site-header";

// Solo permitimos callbackUrls que sean rutas internas. Si alguien intenta
// `?callbackUrl=https://malicio.us` lo descartamos y caemos al default.
function safeCallbackUrl(raw: string | undefined): string {
  if (!raw) return "/admin/events";
  if (!raw.startsWith("/")) return "/admin/events";
  if (raw.startsWith("//")) return "/admin/events";
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  if (!isAuthConfigured()) {
    redirect("/");
  }
  const { callbackUrl: raw } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);

  const session = await auth();
  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="grid w-full flex-1 place-items-center px-6 py-6">
        <div className="w-full max-w-md">
          <div
            className="flex w-full flex-col gap-6 border border-graphite-dark/20 bg-paper p-8 md:p-10"
            style={{ borderRadius: "var(--radius)" }}
          >
          <div className="flex items-center gap-3">
            <TranqueraMark className="h-7 w-7" />
            <span className="text-xl font-semibold lowercase tracking-tight">
              tranquera
            </span>
            <span className="ml-2 border-l border-graphite-dark/20 pl-3 font-mono text-xs uppercase tracking-wider text-graphite">
              admin
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-graphite">
              // ingresá
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">
              Iniciá sesión.
            </h1>
            <p className="text-sm leading-relaxed text-graphite-dark">
              Continuá con Google. Si te invitaron, entrás a la org de tu
              equipo. Si todavía no estás invitado, creás una nueva como
              admin owner.
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 bg-ink px-6 py-3.5 font-medium text-paper transition-colors hover:bg-graphite-dark"
              style={{ borderRadius: "var(--radius)" }}
            >
              <GoogleMark className="h-5 w-5" />
              Continuar con Google
            </button>
          </form>

            <p className="font-mono text-[11px] leading-relaxed text-graphite">
              // sólo loggeamos email, nombre y avatar.
              <br />
              // sin tracking, sin tokens de gmail.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function TranqueraMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Tranquera"
      width={64}
      height={64}
      className={`${className} object-contain`}
      style={{ borderRadius: "var(--radius)" }}
    />
  );
}

function GoogleMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="#fff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#fff"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        opacity=".75"
      />
      <path
        fill="#fff"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.83z"
        opacity=".55"
      />
      <path
        fill="#fff"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
        opacity=".35"
      />
    </svg>
  );
}
