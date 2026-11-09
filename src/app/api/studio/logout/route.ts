import { NextResponse } from "next/server";
import { clearDevSessionCookie } from "@/lib/access";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearDevSessionCookie());
  return res;
}
