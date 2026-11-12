import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Projects } from "@/components/Projects";
import { Contact } from "@/components/Contact";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { listProjects } from "@/lib/projects-store";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const projects = await listProjects();

  return (
    <main id="main">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[var(--radius-sm)] focus:bg-[var(--color-ink)] focus:px-3 focus:py-2 focus:text-[var(--color-paper)]"
      >
        {dict.nav.skipToContent}
      </a>
      <div id="main-content" tabIndex={-1}>
        <Hero locale={locale} dict={dict} />
        <About locale={locale} dict={dict} />
        <Projects locale={locale} dict={dict} projects={projects} />
        <Contact dict={dict} />
      </div>
    </main>
  );
}
