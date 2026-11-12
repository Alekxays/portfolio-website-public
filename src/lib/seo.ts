import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n";
import { site, skills } from "@/content/site";
import type { Dictionary } from "@/content/dictionaries/types";

export function localeUrl(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  if (locale === defaultLocale) {
    return clean ? `${site.url}/${clean}` : `${site.url}/`;
  }
  return clean ? `${site.url}/${locale}/${clean}` : `${site.url}/${locale}`;
}

export function buildMetadata(locale: Locale, dict: Dictionary): Metadata {
  const canonical = localeUrl(locale);
  const ogLocale = locale === "fr" ? "fr_FR" : "en_US";

  return {
    metadataBase: new URL(site.url),
    title: dict.meta.title,
    description: dict.meta.description,
    keywords: dict.meta.keywords,
    authors: [{ name: site.nameDisplay, url: site.url }],
    creator: site.nameDisplay,
    publisher: site.nameDisplay,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical,
      languages: {
        fr: localeUrl("fr"),
        en: localeUrl("en"),
        "x-default": localeUrl("fr"),
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
      url: canonical,
      siteName: site.nameDisplay,
      title: dict.meta.title,
      description: dict.meta.description,
      images: [
        {
          url: "/img/og-portrait.jpg",
          width: 1200,
          height: 1200,
          alt: site.nameDisplay,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
      creator: site.twitter,
      images: ["/img/og-portrait.jpg"],
    },
  };
}

export function personJsonLd(locale: Locale, dict: Dictionary) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.nameDisplay,
        description: dict.meta.description,
        inLanguage: locale,
        publisher: { "@id": `${site.url}/#person` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${site.url}/#profilepage`,
        url: localeUrl(locale),
        name: dict.meta.title,
        description: dict.meta.description,
        inLanguage: locale,
        isPartOf: { "@id": `${site.url}/#website` },
        about: { "@id": `${site.url}/#person` },
        mainEntity: { "@id": `${site.url}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${site.url}/#person`,
        name: site.nameDisplay,
        url: site.url,
        email: site.email,
        jobTitle: site.role[locale],
        image: `${site.url}${site.portrait}`,
        sameAs: [site.socials.github, site.socials.linkedin],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Paris",
          addressCountry: "FR",
        },
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: site.education,
        },
        knowsAbout: [
          "Web development",
          "Mobile development",
          ...skills,
        ],
      },
    ],
  };
}
