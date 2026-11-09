"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/applications", label: "Applications" },
  { href: "/studio/profile", label: "Profile" },
  { href: "/studio/projects", label: "Projects" },
];

export function StudioShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/studio/logout", { method: "POST" });
    router.push("/studio/login");
    router.refresh();
  }

  return (
    <div className="min-h-svh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <header className="border-b border-[var(--color-rule)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.14em] text-[var(--color-neutral)] uppercase">
              Studio
            </p>
            <h1 className="text-lg font-semibold tracking-tight">Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            {email ? (
              <span className="hidden font-[family-name:var(--font-mono)] text-[0.7rem] text-[var(--color-neutral)] sm:inline">
                {email}
              </span>
            ) : null}
            <Link
              href="/"
              className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-neutral)] uppercase hover:text-[var(--color-ink)]"
            >
              Site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-neutral)] uppercase hover:text-[var(--color-ink)]"
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-6 px-5 sm:px-8">
          {links.map((link) => {
            const active =
              link.href === "/studio"
                ? pathname === "/studio"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 pb-3 font-[family-name:var(--font-mono)] text-[0.75rem] tracking-[0.08em] uppercase ${
                  active
                    ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-neutral)] hover:text-[var(--color-ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
