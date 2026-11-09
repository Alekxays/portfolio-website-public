import { NextResponse } from "next/server";
import { getCvBytes } from "@/lib/cv-store";
import { isCvLocale, staticCvPath } from "@/lib/cv";

export const runtime = "nodejs";

type Params = { params: Promise<{ locale: string }> };

export async function GET(request: Request, { params }: Params) {
  const { locale: raw } = await params;
  const locale = raw?.toLowerCase();
  if (!locale || !isCvLocale(locale)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const stored = await getCvBytes(locale);
    if (stored) {
      return new NextResponse(stored.bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${stored.filename}"`,
          "Cache-Control": "public, max-age=300",
        },
      });
    }
  } catch {
    // Fall through to static file.
  }

  const url = new URL(staticCvPath(locale), request.url);
  return NextResponse.redirect(url, 302);
}
