import { NextResponse } from "next/server";
import { requireStudioIdentity } from "@/lib/access";
import { isCvLocale, type CvLocale } from "@/lib/cv";
import {
  deleteCvUpload,
  listCvMeta,
  saveCvUpload,
} from "@/lib/cv-store";

export async function GET(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const files = await listCvMeta();
    return NextResponse.json({ files });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load CV metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const localeRaw = String(form.get("locale") ?? "").toLowerCase();
    const file = form.get("file");

    if (!isCvLocale(localeRaw)) {
      return NextResponse.json(
        { error: "locale must be fr or en" },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF only" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const filename =
      file.name?.trim() ||
      `CV-Alexandre-BOISSEL-${localeRaw.toUpperCase()}.pdf`;

    const meta = await saveCvUpload({
      locale: localeRaw as CvLocale,
      filename,
      bytes,
    });

    return NextResponse.json({ file: meta }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = new URL(request.url).searchParams.get("locale")?.toLowerCase();
  if (!locale || !isCvLocale(locale)) {
    return NextResponse.json({ error: "locale required" }, { status: 400 });
  }

  try {
    await deleteCvUpload(locale);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
