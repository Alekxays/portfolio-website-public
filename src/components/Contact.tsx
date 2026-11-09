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
    "w-full border border-[var(--color-rule-strong)] bg-transparent px-3.5 py-3 text-[var(--color-ink)] placeholder:text-[var(--color-neutral)] transition-colors focus:border-[var(--color-ink)] focus:outline-none";

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="section-pad border-t border-[var(--color-rule)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-4">{dict.contact.eyebrow}</p>
          <h2
            id="contact-title"
            className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl"
          >
            {dict.contact.title}
          </h2>
          <p className="mt-4 max-w-sm text-[var(--color-ink-soft)]">
            {dict.contact.description}
          </p>
          <div className="mt-8 space-y-3">
            <p className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase">
              {dict.contact.orEmail}
            </p>
            <a
              href={`mailto:${site.email}`}
              className="link-accent inline-block text-lg text-[var(--color-ink)]"
            >
              {site.email}
            </a>
            <div className="flex gap-4 pt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-neutral)]">
              <a
                href={site.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent hover:text-[var(--color-ink)]"
              >
                LinkedIn ↗
              </a>
              <a
                href={site.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent hover:text-[var(--color-ink)]"
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
            className="space-y-4 border border-[var(--color-rule)] p-5 sm:p-7"
            noValidate
          >
            <div>
              <label htmlFor="name" className="mb-2 block text-sm text-[var(--color-ink)]">
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
              <label htmlFor="email" className="mb-2 block text-sm text-[var(--color-ink)]">
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
              <label htmlFor="message" className="mb-2 block text-sm text-[var(--color-ink)]">
                {dict.contact.message}
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder={dict.contact.placeholders.message}
                className={`${fieldClass} min-h-32 resize-y`}
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
