import { NextRequest, NextResponse } from "next/server";
import { createPolicy, listPolicies, type PolicySeverity } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

const severities: PolicySeverity[] = ["low", "medium", "high", "critical"];

export function GET() {
  return NextResponse.json({ policies: listPolicies() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (typeof body.domain !== "string" || typeof body.rule !== "string" || !severities.includes(body.severity)) {
    return NextResponse.json({ error: "Datos de política inválidos." }, { status: 400 });
  }

  const policy = createPolicy({
    domain: body.domain,
    rule: body.rule,
    severity: body.severity,
    is_active: Boolean(body.is_active),
  });

  return NextResponse.json({ policy }, { status: 201 });
}
