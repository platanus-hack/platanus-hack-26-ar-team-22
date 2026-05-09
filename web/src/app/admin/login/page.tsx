"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/layout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@team22.dev");
  const [code, setCode] = useState("123456");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.cookie = `admin_session=${encodeURIComponent(email)}; path=/; max-age=86400`;
    router.push("/admin/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Guardrail</Link>
          <ThemeToggle />
        </header>
        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Login demo</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Entrá al backoffice sin fricción.</h1>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Para la demo no bloqueamos el flujo con auth real. Este paso simula el acceso del compliance officer al dashboard.
            </p>
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Código demo: <span className="font-mono font-semibold text-foreground">123456</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acceso admin</CardTitle>
              <CardDescription>Usá cualquier email y el código precargado para continuar.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Email</span>
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Código</span>
                  <Input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" required />
                </label>
                <Button type="submit" className="w-full" disabled={!email || !code}>
                  Entrar al dashboard
                </Button>
                <Button asChildShim type="button" variant="ghost" className="w-full">
                  <Link href="/admin/dashboard">Saltar login para demo</Link>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
