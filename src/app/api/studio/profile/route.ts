import { NextResponse } from "next/server";
import { requireStudioIdentity } from "@/lib/access";
import { emptyProfile, type StudioProfile } from "@/lib/profile";
import { getStudioProfile, saveStudioProfile } from "@/lib/profile-store";

function normalizeProfile(
  input: Partial<StudioProfile> & Record<string, unknown>,
): Omit<StudioProfile, "updatedAt"> {
  const base = emptyProfile();
  return {
    fullName: String(input.fullName ?? base.fullName).trim(),
    email: String(input.email ?? base.email).trim(),
    phone: String(input.phone ?? base.phone).trim(),
    school: String(input.school ?? base.school).trim(),
    program: String(input.program ?? base.program).trim(),
    targetRole: String(input.targetRole ?? base.targetRole).trim(),
    skills: String(input.skills ?? base.skills),
    experience: String(input.experience ?? base.experience),
    cvText: String(input.cvText ?? base.cvText),
    tone: String(input.tone ?? base.tone).trim() || "pro_chaleureux",
  };
}

export async function GET(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getStudioProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | (Partial<StudioProfile> & Record<string, unknown>)
    | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const normalized = normalizeProfile(body);
  if (!normalized.fullName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  try {
    const profile = await saveStudioProfile(normalized);
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
