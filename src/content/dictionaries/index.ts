import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "./types";
import fr from "./fr";
import en from "./en";

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}

export type { Dictionary };
