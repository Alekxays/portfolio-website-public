import { NextResponse } from "next/server";
import { requireStudioIdentity } from "@/lib/access";
import { fetchAnalyticsSnapshot } from "@/lib/analytics";

export async function GET(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "7");
  const rangeDays = [1, 7, 14, 30].includes(days) ? days : 7;
  const snapshot = await fetchAnalyticsSnapshot(rangeDays);
  return NextResponse.json({ identity, snapshot });
}
