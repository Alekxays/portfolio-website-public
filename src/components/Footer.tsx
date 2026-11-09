import type { Dictionary } from "@/content/dictionaries/types";
import { site } from "@/content/site";

export function Footer({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-rule)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-[var(--color-ink-soft)]">{dict.footer.credit}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.04em] text-[var(--color-neutral)]">
          <a
            href={site.socials.github}
            className="link-accent hover:text-[var(--color-ink)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href={site.socials.linkedin}
            className="link-accent hover:text-[var(--color-ink)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${site.email}`}
            className="link-accent hover:text-[var(--color-ink)]"
          >
            {site.email}
          </a>
          <span>
            © {year} {site.name} — {dict.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
