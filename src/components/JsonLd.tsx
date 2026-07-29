import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/content/dictionaries/types";
import { personJsonLd } from "@/lib/seo";

export function JsonLd({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const data = personJsonLd(locale, dict);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
