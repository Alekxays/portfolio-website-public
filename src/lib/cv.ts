import type { Locale } from "@/lib/i18n";

export const CV_LOCALES = ["fr", "en"] as const;
export type CvLocale = (typeof CV_LOCALES)[number];

export type CvMeta = {
  locale: CvLocale;
  filename: string;
  updatedAt: string;
  hasUpload: boolean;
};

export function isCvLocale(value: string): value is CvLocale {
  return (CV_LOCALES as readonly string[]).includes(value);
}

export function cvKvKey(locale: CvLocale) {
  return `cv:${locale}`;
}

export function staticCvPath(locale: Locale | CvLocale) {
  return locale === "en"
    ? "/files/CV-Alexandre-BOISSEL-EN.pdf"
    : "/files/CV-Alexandre-BOISSEL-FR.pdf";
}

export function publicCvPath(
  locale: Locale | CvLocale,
  options?: { v?: string; download?: boolean },
) {
  const params = new URLSearchParams();
  if (options?.v) params.set("v", options.v);
  if (options?.download) params.set("download", "1");
  const qs = params.toString();
  return qs ? `/cv/${locale}?${qs}` : `/cv/${locale}`;
}

export function monthsBetween(fromIso: string, to = new Date()) {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return Number.POSITIVE_INFINITY;
  const ms = to.getTime() - from.getTime();
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}
