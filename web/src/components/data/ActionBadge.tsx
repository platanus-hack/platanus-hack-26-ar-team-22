import { Badge } from "@/components/ui";

export type ProxyAction = "BLOCK" | "REDACT" | "WARN" | "LOG";

const variants: Record<ProxyAction, "danger" | "warning" | "notice" | "muted"> = {
  BLOCK: "danger",
  REDACT: "warning",
  WARN: "notice",
  LOG: "muted",
};

export function ActionBadge({ action }: { action: ProxyAction }) {
  return <Badge variant={variants[action]}>{action}</Badge>;
}
