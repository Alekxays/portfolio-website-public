import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireStudioIdentity, isAccessMode } from "@/lib/access";
import { StudioShell } from "@/components/studio/StudioShell";

export const dynamic = "force-dynamic";

export default async function StudioProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const request = new Request("https://studio.local", {
    headers: headerStore,
  });
  const identity = await requireStudioIdentity(request);

  if (!identity) {
    if (isAccessMode()) {
      return (
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <p className="eyebrow mb-3">Studio</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Access required
          </h1>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Cloudflare Access did not provide a valid assertion. Open this URL
            through your Access application, or check{" "}
            <code className="font-mono text-[0.8rem]">CF_ACCESS_*</code>{" "}
            secrets.
          </p>
        </div>
      );
    }
    redirect("/studio/login");
  }

  return <StudioShell email={identity.email}>{children}</StudioShell>;
}
