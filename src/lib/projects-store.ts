import {
  projects as seedProjects,
  type Project,
  type ProjectLink,
  type ProjectStatus,
} from "@/content/projects";
import { getDb } from "@/lib/db";

type ProjectRow = {
  id: string;
  title: string;
  year: string;
  status: string;
  skills_json: string;
  summary_fr: string;
  summary_en: string;
  pitch_fr: string;
  pitch_en: string;
  links_json: string;
  image: string | null;
  sort_order: number;
};

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    status: row.status as ProjectStatus,
    skills: JSON.parse(row.skills_json) as string[],
    summary: { fr: row.summary_fr, en: row.summary_en },
    pitch: { fr: row.pitch_fr, en: row.pitch_en },
    links: JSON.parse(row.links_json) as ProjectLink[],
    image: row.image || undefined,
  };
}

export function projectToParams(project: Project, sortOrder: number) {
  return {
    id: project.id,
    title: project.title,
    year: project.year,
    status: project.status,
    skills_json: JSON.stringify(project.skills),
    summary_fr: project.summary.fr,
    summary_en: project.summary.en,
    pitch_fr: project.pitch.fr,
    pitch_en: project.pitch.en,
    links_json: JSON.stringify(project.links),
    image: project.image ?? null,
    sort_order: sortOrder,
  };
}

async function seedIfEmpty(db: D1Database) {
  const count = await db
    .prepare("SELECT COUNT(*) as c FROM projects")
    .first<{ c: number }>();
  if ((count?.c ?? 0) > 0) return;

  const stmt = db.prepare(
    `INSERT INTO projects (
      id, title, year, status, skills_json, summary_fr, summary_en,
      pitch_fr, pitch_en, links_json, image, sort_order, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  );

  await db.batch(
    seedProjects.map((project, index) => {
      const p = projectToParams(project, index);
      return stmt.bind(
        p.id,
        p.title,
        p.year,
        p.status,
        p.skills_json,
        p.summary_fr,
        p.summary_en,
        p.pitch_fr,
        p.pitch_en,
        p.links_json,
        p.image,
        p.sort_order,
      );
    }),
  );
}

export async function listProjects(): Promise<Project[]> {
  try {
    const db = await getDb();
    await seedIfEmpty(db);
    const { results } = await db
      .prepare(
        "SELECT * FROM projects ORDER BY sort_order ASC, year DESC, title ASC",
      )
      .all<ProjectRow>();
    return (results ?? []).map(rowToProject);
  } catch {
    return seedProjects;
  }
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  await seedIfEmpty(db);
  const row = await db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .bind(id)
    .first<ProjectRow>();
  return row ? rowToProject(row) : null;
}

export async function upsertProject(
  project: Project,
  sortOrder?: number,
): Promise<Project> {
  const db = await getDb();
  await seedIfEmpty(db);

  const existing = await db
    .prepare("SELECT sort_order FROM projects WHERE id = ?")
    .bind(project.id)
    .first<{ sort_order: number }>();

  let order = sortOrder;
  if (order === undefined) {
    if (existing) {
      order = existing.sort_order;
    } else {
      const max = await db
        .prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM projects")
        .first<{ m: number }>();
      order = (max?.m ?? -1) + 1;
    }
  }

  const p = projectToParams(project, order);
  await db
    .prepare(
      `INSERT INTO projects (
        id, title, year, status, skills_json, summary_fr, summary_en,
        pitch_fr, pitch_en, links_json, image, sort_order, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        year = excluded.year,
        status = excluded.status,
        skills_json = excluded.skills_json,
        summary_fr = excluded.summary_fr,
        summary_en = excluded.summary_en,
        pitch_fr = excluded.pitch_fr,
        pitch_en = excluded.pitch_en,
        links_json = excluded.links_json,
        image = excluded.image,
        sort_order = excluded.sort_order,
        updated_at = datetime('now')`,
    )
    .bind(
      p.id,
      p.title,
      p.year,
      p.status,
      p.skills_json,
      p.summary_fr,
      p.summary_en,
      p.pitch_fr,
      p.pitch_en,
      p.links_json,
      p.image,
      p.sort_order,
    )
    .run();

  return project;
}

export async function deleteProject(id: string) {
  const db = await getDb();
  await db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
}

export function slugifyId(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
