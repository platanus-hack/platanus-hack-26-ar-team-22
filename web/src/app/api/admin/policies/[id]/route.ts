import { NextRequest, NextResponse } from "next/server";
import { deletePolicy, updatePolicy, type PolicySeverity } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

const severities: PolicySeverity[] = ["low", "medium", "high", "critical"];

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, unknown> = {};

  if (typeof body.domain === "string") patch.domain = body.domain;
  if (typeof body.rule === "string") patch.rule = body.rule;
  if (severities.includes(body.severity)) patch.severity = body.severity;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

  const policy = updatePolicy(id, patch);
  if (!policy) return NextResponse.json({ error: "Política no encontrada." }, { status: 404 });

  return NextResponse.json({ policy });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const deleted = deletePolicy(id);
  if (!deleted) return NextResponse.json({ error: "Política no encontrada." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
