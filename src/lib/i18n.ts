export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/** Path for a locale: FR has no prefix, EN is /en */
export function localePath(locale: Locale, hash = ""): string {
  const base = locale === defaultLocale ? "/" : `/${locale}`;
  if (!hash) return base;
  const clean = hash.startsWith("#") ? hash : `#${hash}`;
  return `${base === "/" ? "" : base}/${clean}`.replace("/#", "/#").replace(/\/+#/, "#");
}

export function localizedHref(locale: Locale, section?: string): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  if (!section) return prefix || "/";
  return `${prefix || ""}/#${section}`.replace(/^\/#/, "/#");
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "fr" ? "en" : "fr";
}

export function switchLocalePath(locale: Locale, pathname: string): string {
  const withoutLocale = pathname.replace(/^\/(fr|en)(?=\/|$)/, "") || "/";
  const next = alternateLocale(locale);
  if (next === defaultLocale) return withoutLocale === "/" ? "/" : withoutLocale;
  return `/${next}${withoutLocale === "/" ? "" : withoutLocale}`;
}
