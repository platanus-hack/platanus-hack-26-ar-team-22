"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { useState } from "react";
import Link from "next/link";

type Suggestion = {
  id: string;
  proposedSlug: string;
  proposedAction: string;
  proposedSeverity: string;
};

type ImportResult = {
  imported: number;
  truncated: boolean;
  suggestions: Suggestion[];
};

export function GdocImportForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gdoc/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ docUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error desconocido");
      } else {
        setResult(data);
        setUrl("");
      }
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-graphite-dark">
        Pegá la URL de un Google Doc público con las políticas de seguridad de
        tu empresa. Tranquera extrae las reglas y las envía a la cola de
        revisión en{" "}
        <Link href="/admin/suggestions" className="underline hover:text-ink">
          sugerencias
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="https://docs.google.com/document/d/..."
          className="flex-1 border border-graphite-dark/30 bg-paper px-3 py-2 font-mono text-sm focus:border-ink focus:outline-none"
          style={{ borderRadius: "var(--radius)" }}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-graphite-dark disabled:opacity-60"
          style={{ borderRadius: "var(--radius)" }}
        >
          {loading ? "// extrayendo…" : "importar doc"}
        </button>
      </form>

      {error && (
        <p className="font-mono text-xs text-red-600">// {error}</p>
      )}

      {result && (
        <div
          className="border border-graphite-dark/20 bg-paper-soft/30 p-4"
          style={{ borderRadius: "var(--radius)" }}
        >
          <p className="mb-2 font-mono text-xs text-graphite">
            // {result.imported} política{result.imported !== 1 ? "s" : ""}{" "}
            enviada{result.imported !== 1 ? "s" : ""} a la cola
            {result.truncated ? " · documento truncado a 30 000 caracteres" : ""}
          </p>
          <ul className="mb-3 flex flex-col gap-1">
            {result.suggestions.map((s) => (
              <li key={s.id} className="flex gap-3 font-mono text-xs text-graphite-dark">
                <span className="text-ink">{s.proposedSlug}</span>
                <span>·</span>
                <span>{s.proposedAction}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/suggestions"
            className="font-mono text-xs uppercase tracking-wider text-graphite underline-offset-2 hover:text-ink hover:underline"
          >
            // revisar en sugerencias →
          </Link>
        </div>
      )}
    </div>
  );
}
