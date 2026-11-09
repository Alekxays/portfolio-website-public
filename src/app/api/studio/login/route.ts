import { NextResponse } from "next/server";
import { createDevSessionCookie, isAccessMode } from "@/lib/access";

export async function POST(request: Request) {
  if (isAccessMode()) {
    return NextResponse.json(
      {
        error:
          "Cloudflare Access is enabled. Authenticate via Access, then open /studio.",
      },
      { status: 400 },
    );
  }

  if (!process.env.STUDIO_DEV_PASSWORD) {
    return NextResponse.json(
      {
        error:
          "STUDIO_DEV_PASSWORD is not set. Add it to .env.local for next dev (and .dev.vars for wrangler).",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;
  const password = body?.password ?? "";
  const cookie = await createDevSessionCookie(password);
  if (!cookie) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie);
  return res;
}
