import { NextResponse } from "next/server";
import { getCvBytes } from "@/lib/cv-store";
import { isCvLocale, staticCvPath } from "@/lib/cv";

export const runtime = "nodejs";

type Params = { params: Promise<{ locale: string }> };

function etagFor(updatedAt: string, filename: string) {
  const raw = `${updatedAt}:${filename}`;
  return `"${raw.replace(/"/g, "")}"`;
}

export async function GET(request: Request, { params }: Params) {
  const { locale: raw } = await params;
  const locale = raw?.toLowerCase();
  if (!locale || !isCvLocale(locale)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const asDownload = url.searchParams.get("download") === "1";

  try {
    const stored = await getCvBytes(locale);
    if (stored) {
      const etag = etagFor(stored.updatedAt, stored.filename);
      const ifNoneMatch = request.headers.get("if-none-match");
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control": "private, no-cache",
          },
        });
      }

      return new NextResponse(stored.bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename="${stored.filename}"`,
          "Cache-Control": "private, no-cache",
          ETag: etag,
          ...(stored.updatedAt
            ? {
                "Last-Modified": new Date(
                  stored.updatedAt.includes("T")
                    ? stored.updatedAt
                    : `${stored.updatedAt.replace(" ", "T")}Z`,
                ).toUTCString(),
              }
            : {}),
        },
      });
    }
  } catch {
    // Fall through to static file.
  }

  const redirectUrl = new URL(staticCvPath(locale), request.url);
  return NextResponse.redirect(redirectUrl, 302);
}
