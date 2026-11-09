import { NextResponse } from "next/server";
import { requireStudioIdentity } from "@/lib/access";
import {
  type Application,
  type ApplicationChannel,
  type ApplicationStatus,
  isApplicationChannel,
  isApplicationStatus,
} from "@/lib/applications";
import {
  deleteApplication,
  listApplications,
  newApplicationId,
  upsertApplication,
} from "@/lib/applications-store";

function emptyToUndefined(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function normalizeApplication(
  input: Partial<Application> & Record<string, unknown>,
  fallbackId?: string,
): Omit<Application, "createdAt" | "updatedAt"> | null {
  const company = String(input.company ?? "").trim();
  const role = String(input.role ?? "").trim();
  if (!company || !role) return null;

  const status: ApplicationStatus = isApplicationStatus(input.status)
    ? input.status
    : "todo";
  const channel: ApplicationChannel = isApplicationChannel(input.channel)
    ? input.channel
    : "website";

  return {
    id: String(input.id ?? fallbackId ?? newApplicationId()).trim(),
    company,
    role,
    status,
    channel,
    url: emptyToUndefined(input.url),
    location: emptyToUndefined(input.location),
    appliedAt: emptyToUndefined(input.appliedAt),
    followUpAt: emptyToUndefined(input.followUpAt),
    interviewAt: emptyToUndefined(input.interviewAt),
    notes: String(input.notes ?? ""),
    jobDescription: String(input.jobDescription ?? ""),
    draftLm: String(input.draftLm ?? ""),
    draftMail: String(input.draftMail ?? ""),
    draftCv: String(input.draftCv ?? ""),
  };
}

export async function GET(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = await listApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load applications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | (Partial<Application> & Record<string, unknown>)
    | null;
  const application = normalizeApplication(body ?? {});
  if (!application) {
    return NextResponse.json(
      { error: "Company and role are required" },
      { status: 400 },
    );
  }

  try {
    const saved = await upsertApplication(application);
    return NextResponse.json({ application: saved }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | (Partial<Application> & Record<string, unknown>)
    | null;
  if (!body?.id) {
    return NextResponse.json({ error: "Missing application id" }, { status: 400 });
  }

  const application = normalizeApplication(body, body.id);
  if (!application) {
    return NextResponse.json(
      { error: "Company and role are required" },
      { status: 400 },
    );
  }

  try {
    const saved = await upsertApplication(application);
    return NextResponse.json({ application: saved });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await deleteApplication(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
