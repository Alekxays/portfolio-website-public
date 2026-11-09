import { NextResponse } from "next/server";
import { requireStudioIdentity } from "@/lib/access";
import type { Project, ProjectLink, ProjectStatus } from "@/content/projects";
import {
  deleteProject,
  listProjects,
  slugifyId,
  upsertProject,
} from "@/lib/projects-store";

function isStatus(value: unknown): value is ProjectStatus {
  return value === "ongoing" || value === "paused" || value === "finished";
}

function normalizeProject(input: Partial<Project>, fallbackId?: string): Project | null {
  const title = String(input.title ?? "").trim();
  if (!title) return null;

  const id = String(input.id ?? fallbackId ?? slugifyId(title)).trim();
  if (!id) return null;

  const status = isStatus(input.status) ? input.status : "ongoing";
  const year = String(input.year ?? new Date().getFullYear()).trim();
  const skills = Array.isArray(input.skills)
    ? input.skills.map(String).map((s) => s.trim()).filter(Boolean)
    : [];
  const links = Array.isArray(input.links)
    ? (input.links as ProjectLink[]).filter(
        (l) => l && typeof l.url === "string" && l.url.length > 0,
      )
    : [];

  return {
    id,
    title,
    year,
    status,
    skills,
    summary: {
      fr: String(input.summary?.fr ?? ""),
      en: String(input.summary?.en ?? ""),
    },
    pitch: {
      fr: String(input.pitch?.fr ?? ""),
      en: String(input.pitch?.en ?? ""),
    },
    links,
    image: input.image ? String(input.image) : undefined,
  };
}

export async function GET(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<Project> | null;
  const project = normalizeProject(body ?? {});
  if (!project) {
    return NextResponse.json({ error: "Invalid project payload" }, { status: 400 });
  }

  const saved = await upsertProject(project);
  return NextResponse.json({ project: saved }, { status: 201 });
}

export async function PUT(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<Project> | null;
  if (!body?.id) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }
  const project = normalizeProject(body, body.id);
  if (!project) {
    return NextResponse.json({ error: "Invalid project payload" }, { status: 400 });
  }

  const saved = await upsertProject(project);
  return NextResponse.json({ project: saved });
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
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}
