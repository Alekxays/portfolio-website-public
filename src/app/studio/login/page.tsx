import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAccessMode, requireStudioIdentity } from "@/lib/access";
import { StudioLoginForm } from "@/components/studio/StudioLoginForm";

export const dynamic = "force-dynamic";

export default async function StudioLoginPage() {
  if (isAccessMode()) {
    redirect("/studio");
  }

  const headerStore = await headers();
  const request = new Request("https://studio.local", {
    headers: headerStore,
  });
  const identity = await requireStudioIdentity(request);
  if (identity) redirect("/studio");

  return (
    <div className="min-h-svh bg-[var(--color-paper)] px-5 text-[var(--color-ink)]">
      <StudioLoginForm />
    </div>
  );
}
