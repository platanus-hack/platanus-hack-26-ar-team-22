import { NextResponse } from "next/server";
import { listInteractions } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ interactions: listInteractions() });
}
