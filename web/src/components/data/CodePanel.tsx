import { cn } from "@/components/ui";

export function CodePanel({ code, title, className }: { code: string; title?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-slate-950 text-slate-100 shadow-sm", className)}>
      {title ? <div className="border-b border-white/10 px-4 py-2 text-xs font-medium text-slate-400">{title}</div> : null}
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}
