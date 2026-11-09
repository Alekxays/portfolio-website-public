import { NextResponse } from "next/server";
import { requireStudioIdentity } from "@/lib/access";
import type { StudioGenerateKind } from "@/lib/ai";
import { getApplication, upsertApplication } from "@/lib/applications-store";
import { getStudioProfile, profileIsReady } from "@/lib/profile-store";
import { generateApplicationCopy } from "@/lib/studio-generate";

const KINDS: StudioGenerateKind[] = ["lm", "mail", "cv"];

function isKind(value: unknown): value is StudioGenerateKind {
  return typeof value === "string" && (KINDS as string[]).includes(value);
}

export async function POST(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    kind?: string;
    jobDescription?: string;
    mailKind?: "apply" | "followup";
    quality?: boolean;
    save?: boolean;
  } | null;

  if (!body?.applicationId || !isKind(body.kind)) {
    return NextResponse.json(
      { error: "applicationId and kind (lm|mail|cv) are required" },
      { status: 400 },
    );
  }

  try {
    const [profile, application] = await Promise.all([
      getStudioProfile(),
      getApplication(body.applicationId),
    ]);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (!profileIsReady(profile)) {
      return NextResponse.json(
        {
          error:
            "Complete your Studio profile first (name + CV / experience / skills).",
        },
        { status: 400 },
      );
    }

    const jobDescription =
      typeof body.jobDescription === "string"
        ? body.jobDescription
        : application.jobDescription;

    const { model, text } = await generateApplicationCopy({
      kind: body.kind,
      profile,
      application,
      jobDescription,
      mailKind: body.mailKind === "followup" ? "followup" : "apply",
      quality: Boolean(body.quality),
    });

    if (!text) {
      return NextResponse.json(
        { error: "Empty model response" },
        { status: 502 },
      );
    }

    let saved = application;
    if (body.save !== false) {
      saved = await upsertApplication({
        ...application,
        jobDescription,
        draftLm: body.kind === "lm" ? text : application.draftLm,
        draftMail: body.kind === "mail" ? text : application.draftMail,
        draftCv: body.kind === "cv" ? text : application.draftCv,
      });
    }

    return NextResponse.json({
      kind: body.kind,
      model,
      text,
      application: saved,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
