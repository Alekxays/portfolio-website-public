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
  object_key: string | null;
};

async function getCvKv() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.CV_STORE) {
    throw new Error("KV binding CV_STORE is not configured");
  }
  return env.CV_STORE;
}

function legacyCvKey(locale: CvLocale) {
  return cvKvKey(locale);
}

function versionedCvKey(locale: CvLocale) {
  return `${cvKvKey(locale)}:${Date.now()}`;
}

export async function listCvMeta(): Promise<CvMeta[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      "SELECT locale, filename, updated_at, object_key FROM cv_files",
    )
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
    .prepare(
      "SELECT locale, filename, updated_at, object_key FROM cv_files WHERE locale = ?",
    )
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

async function getCvRow(locale: CvLocale) {
  const db = await getDb();
  return db
    .prepare(
      "SELECT locale, filename, updated_at, object_key FROM cv_files WHERE locale = ?",
    )
    .bind(locale)
    .first<CvRow>();
}

export async function getCvBytes(locale: CvLocale): Promise<{
  bytes: ArrayBuffer;
  filename: string;
  updatedAt: string;
  source: "kv" | "static";
} | null> {
  const kv = await getCvKv();
  const row = await getCvRow(locale);
  const keys = [
    row?.object_key,
    legacyCvKey(locale),
  ].filter((key): key is string => Boolean(key));

  for (const key of keys) {
    const stored = await kv.get(key, "arrayBuffer");
    if (stored && stored.byteLength > 0) {
      return {
        bytes: stored,
        filename: row?.filename ?? `CV-${locale.toUpperCase()}.pdf`,
        updatedAt: row?.updated_at ?? "",
        source: "kv",
      };
    }
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
  const previous = await getCvRow(options.locale);
  const objectKey = versionedCvKey(options.locale);

  // Versioned key avoids KV overwrite eventual-consistency serving the previous PDF.
  await kv.put(objectKey, options.bytes, {
    metadata: {
      filename: options.filename,
      contentType: "application/pdf",
    },
  });

  await db
    .prepare(
      `INSERT INTO cv_files (locale, filename, updated_at, object_key)
       VALUES (?, ?, datetime('now'), ?)
       ON CONFLICT(locale) DO UPDATE SET
         filename = excluded.filename,
         updated_at = datetime('now'),
         object_key = excluded.object_key`,
    )
    .bind(options.locale, options.filename, objectKey)
    .run();

  const staleKeys = new Set<string>();
  if (previous?.object_key && previous.object_key !== objectKey) {
    staleKeys.add(previous.object_key);
  }
  staleKeys.add(legacyCvKey(options.locale));
  await Promise.all(
    [...staleKeys].map((key) => kv.delete(key).catch(() => undefined)),
  );

  return getCvMeta(options.locale);
}

export async function deleteCvUpload(locale: CvLocale) {
  const kv = await getCvKv();
  const db = await getDb();
  const previous = await getCvRow(locale);
  const keys = [
    previous?.object_key,
    legacyCvKey(locale),
  ].filter((key): key is string => Boolean(key));

  await Promise.all(keys.map((key) => kv.delete(key).catch(() => undefined)));
  await db.prepare("DELETE FROM cv_files WHERE locale = ?").bind(locale).run();
}
