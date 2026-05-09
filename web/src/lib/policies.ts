// Shared helpers for policy CRUD. Lives next to lib/prisma so route handlers
// and server components consume the same shape and slugifier.

import type { Policy } from "@prisma/client";

export const POLICY_DOMAINS = [
  "credentials",
  "pii",
  "internal_paths",
  "business_policy",
  "code",
] as const;
export type PolicyDomain = (typeof POLICY_DOMAINS)[number];

export const ADMIN_ACTIONS = ["BLOCK", "LOG"] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export const SEVERITIES = ["low", "medium", "high"] as const;
export type Severity = (typeof SEVERITIES)[number];

export type RuleDTO = {
  id: string;
  slug: string;
  domain: PolicyDomain;
  layer: "regex" | "pattern" | "nl";
  rule: string;
  defaultAction: AdminAction | "REDACT" | "WARN";
  severity: Severity;
  source: "seed" | "admin" | "ai_suggestor";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toRuleDTO(p: Policy): RuleDTO {
  return {
    id: p.id,
    slug: p.slug,
    domain: p.domain as PolicyDomain,
    layer: p.layer as RuleDTO["layer"],
    rule: p.rule,
    defaultAction: p.defaultAction as RuleDTO["defaultAction"],
    severity: p.severity as Severity,
    source: p.source as RuleDTO["source"],
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
