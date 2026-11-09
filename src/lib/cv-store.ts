import {
  CV_LOCALES,
  type CvLocale,
  type CvMeta,
  cvKvKey,
  staticCvPath,
} from "@/lib/cv";
import { getDb } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type CvRow = {
  locale: string;
  filename: string;
  updated_at: string;
};

async function getCvKv() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.CV_STORE) {
    throw new Error("KV binding CV_STORE is not configured");
  }
  return env.CV_STORE;
}

export async function listCvMeta(): Promise<CvMeta[]> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT locale, filename, updated_at FROM cv_files")
    .all<CvRow>();
  const byLocale = new Map(
    (results ?? []).map((row) => [row.locale as CvLocale, row]),
  );

  return CV_LOCALES.map((locale) => {
    const row = byLocale.get(locale);
    return {
      locale,
      filename: row?.filename ?? staticCvPath(locale).split("/").pop()!,
      updatedAt: row?.updated_at ?? "",
      hasUpload: Boolean(row),
    };
  });
}

export async function getCvMeta(locale: CvLocale): Promise<CvMeta | null> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT locale, filename, updated_at FROM cv_files WHERE locale = ?")
    .bind(locale)
    .first<CvRow>();
  if (!row) return null;
  return {
    locale,
    filename: row.filename,
    updatedAt: row.updated_at,
    hasUpload: true,
  };
}

export async function getCvBytes(locale: CvLocale): Promise<{
  bytes: ArrayBuffer;
  filename: string;
  source: "kv" | "static";
} | null> {
  const kv = await getCvKv();
  const stored = await kv.get(cvKvKey(locale), "arrayBuffer");
  if (stored && stored.byteLength > 0) {
    const meta = await getCvMeta(locale);
    return {
      bytes: stored,
      filename: meta?.filename ?? `CV-${locale.toUpperCase()}.pdf`,
      source: "kv",
    };
  }
  return null;
}

export async function saveCvUpload(options: {
  locale: CvLocale;
  filename: string;
  bytes: ArrayBuffer;
}) {
  if (options.bytes.byteLength === 0) {
    throw new Error("Empty file");
  }
  if (options.bytes.byteLength > 4_500_000) {
    throw new Error("PDF too large (max ~4.5MB)");
  }

  const kv = await getCvKv();
  const db = await getDb();
  await kv.put(cvKvKey(options.locale), options.bytes, {
    metadata: {
      filename: options.filename,
      contentType: "application/pdf",
    },
  });

  await db
    .prepare(
      `INSERT INTO cv_files (locale, filename, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(locale) DO UPDATE SET
         filename = excluded.filename,
         updated_at = datetime('now')`,
    )
    .bind(options.locale, options.filename)
    .run();

  return getCvMeta(options.locale);
}

export async function deleteCvUpload(locale: CvLocale) {
  const kv = await getCvKv();
  const db = await getDb();
  await kv.delete(cvKvKey(locale));
  await db.prepare("DELETE FROM cv_files WHERE locale = ?").bind(locale).run();
}
