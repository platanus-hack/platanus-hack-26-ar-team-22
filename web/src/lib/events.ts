import type { Interaction } from "@prisma/client";

export type PolicyHitRecord = {
  layer: "regex" | "pattern" | "nl";
  policy_id: string;
  slug: string;
  action: "BLOCK" | "REDACT" | "WARN" | "LOG";
};

export type EventDTO = {
  id: string;
  traceId: string;
  action: "BLOCK" | "REDACT" | "WARN" | "LOG";
  reason: string;
  requestModel: string;
  prompt: string;
  policyHits: PolicyHitRecord[];
  latencyTotalMs: number;
  latencyByLayer: Record<string, number>;
  upstreamStatus: number | null;
  createdAt: string;
};

export function toEventDTO(row: Interaction): EventDTO {
  return {
    id: row.id,
    traceId: row.traceId,
    action: row.action as EventDTO["action"],
    reason: row.reason,
    requestModel: row.requestModel,
    prompt: row.prompt,
    policyHits: (row.policyHits ?? []) as PolicyHitRecord[],
    latencyTotalMs: row.latencyTotalMs,
    latencyByLayer: (row.latencyByLayer ?? {}) as Record<string, number>,
    upstreamStatus: row.upstreamStatus,
    createdAt: row.createdAt.toISOString(),
  };
}
