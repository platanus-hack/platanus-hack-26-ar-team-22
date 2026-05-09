import { Badge } from "@/components/ui";

export type Severity = "low" | "medium" | "high" | "critical";

const variants: Record<Severity, "muted" | "warning" | "notice" | "danger"> = {
  low: "muted",
  medium: "warning",
  high: "notice",
  critical: "danger",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge variant={variants[severity]}>{severity}</Badge>;
}
