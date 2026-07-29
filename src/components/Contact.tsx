"use client";

import { FormEvent, useRef, useState } from "react";
import type { Dictionary } from "@/content/dictionaries/types";
import { site } from "@/content/site";
import { Reveal } from "./Reveal";

export function Contact({ dict }: { dict: Dictionary }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;

    const formSpreeUrl = process.env.NEXT_PUBLIC_FORM_SPREE_URL;
    if (!formSpreeUrl) {
      setStatus("error");
      return;
    }

    setStatus("sending");

    const data = {
      from_name:
        (formRef.current.elements.namedItem("name") as HTMLInputElement).value,
      from_email: (
        formRef.current.elements.namedItem("email") as HTMLInputElement
      ).value,
      message: (
        formRef.current.elements.namedItem("message") as HTMLTextAreaElement
      ).value,
    };

    try {
      const res = await fetch(formSpreeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        formRef.current.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const fieldClass =
    "w-full rounded-[var(--radius-sm)] border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3.5 py-3 text-[var(--color-ink)] placeholder:text-[var(--color-neutral)] transition-colors focus:border-[var(--color-accent)] focus:outline-none";

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="section-pad border-t border-[var(--color-rule)] bg-[var(--color-graphite)] text-[var(--color-graphite-ink)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="mb-4 font-[family-name:var(--font-mono)] text-[0.7rem] font-medium tracking-[0.08em] text-[color-mix(in_oklch,var(--color-graphite-ink)_55%,transparent)] uppercase">
            {dict.contact.eyebrow}
          </p>
          <h2
            id="contact-title"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {dict.contact.title}
          </h2>
          <p className="mt-4 max-w-sm text-[color-mix(in_oklch,var(--color-graphite-ink)_78%,transparent)]">
            {dict.contact.description}
          </p>
          <div className="mt-8 space-y-3">
            <p className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.08em] uppercase opacity-60">
              {dict.contact.orEmail}
            </p>
            <a
              href={`mailto:${site.email}`}
              className="inline-block text-lg text-[var(--color-accent)] hover:underline"
            >
              {site.email}
            </a>
            <div className="flex gap-4 pt-2 font-[family-name:var(--font-mono)] text-sm">
              <a
                href={site.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:text-[var(--color-accent)] hover:opacity-100"
              >
                LinkedIn ↗
              </a>
              <a
                href={site.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:text-[var(--color-accent)] hover:opacity-100"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="space-y-4 rounded-[var(--radius-md)] border border-[color-mix(in_oklch,var(--color-graphite-ink)_12%,transparent)] bg-[color-mix(in_oklch,var(--color-paper)_6%,transparent)] p-5 sm:p-7"
            noValidate
          >
            <div>
              <label htmlFor="name" className="mb-2 block text-sm">
                {dict.contact.name}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={dict.contact.placeholders.name}
                className={fieldClass}
                disabled={status === "sending"}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm">
                {dict.contact.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={dict.contact.placeholders.email}
                className={fieldClass}
                disabled={status === "sending"}
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-sm">
                {dict.contact.message}
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder={dict.contact.placeholders.message}
                className={`${fieldClass} resize-y min-h-32`}
                disabled={status === "sending"}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full sm:w-auto"
              disabled={status === "sending"}
              data-state={status === "sending" ? "loading" : undefined}
            >
              {status === "sending" ? dict.contact.sending : dict.contact.submit}
            </button>
            {status === "success" || status === "error" ? (
              <p
                role="status"
                className={`text-sm ${status === "success" ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}
              >
                {status === "success"
                  ? dict.contact.success
                  : dict.contact.error}
              </p>
            ) : null}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
