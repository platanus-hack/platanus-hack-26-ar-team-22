import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getMetrics());
}
