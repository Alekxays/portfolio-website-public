import {
  type Application,
  type ApplicationChannel,
  type ApplicationStatus,
} from "@/lib/applications";
import { getDb } from "@/lib/db";

type ApplicationRow = {
  id: string;
  company: string;
  role: string;
  status: string;
  channel: string;
  url: string | null;
  location: string | null;
  applied_at: string | null;
  follow_up_at: string | null;
  interview_at: string | null;
  notes: string;
  job_description: string | null;
  draft_lm: string | null;
  draft_mail: string | null;
  draft_cv: string | null;
  created_at: string;
  updated_at: string;
};

function rowToApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status as ApplicationStatus,
    channel: row.channel as ApplicationChannel,
    url: row.url || undefined,
    location: row.location || undefined,
    appliedAt: row.applied_at || undefined,
    followUpAt: row.follow_up_at || undefined,
    interviewAt: row.interview_at || undefined,
    notes: row.notes ?? "",
    jobDescription: row.job_description ?? "",
    draftLm: row.draft_lm ?? "",
    draftMail: row.draft_mail ?? "",
    draftCv: row.draft_cv ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listApplications(): Promise<Application[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT * FROM applications
       ORDER BY
         CASE status
           WHEN 'todo' THEN 0
           WHEN 'applied' THEN 1
           WHEN 'interview' THEN 2
           WHEN 'offer' THEN 3
           WHEN 'ghosted' THEN 4
           WHEN 'rejected' THEN 5
           ELSE 6
         END,
         COALESCE(follow_up_at, interview_at, applied_at, created_at) ASC,
         company COLLATE NOCASE ASC`,
    )
    .all<ApplicationRow>();
  return (results ?? []).map(rowToApplication);
}

export async function getApplication(id: string): Promise<Application | null> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .bind(id)
    .first<ApplicationRow>();
  return row ? rowToApplication(row) : null;
}

export async function upsertApplication(
  application: Omit<Application, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
): Promise<Application> {
  const db = await getDb();
  const existing = await getApplication(application.id);

  await db
    .prepare(
      `INSERT INTO applications (
        id, company, role, status, channel, url, location,
        applied_at, follow_up_at, interview_at, notes,
        job_description, draft_lm, draft_mail, draft_cv,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        company = excluded.company,
        role = excluded.role,
        status = excluded.status,
        channel = excluded.channel,
        url = excluded.url,
        location = excluded.location,
        applied_at = excluded.applied_at,
        follow_up_at = excluded.follow_up_at,
        interview_at = excluded.interview_at,
        notes = excluded.notes,
        job_description = excluded.job_description,
        draft_lm = excluded.draft_lm,
        draft_mail = excluded.draft_mail,
        draft_cv = excluded.draft_cv,
        updated_at = datetime('now')`,
    )
    .bind(
      application.id,
      application.company,
      application.role,
      application.status,
      application.channel,
      application.url ?? null,
      application.location ?? null,
      application.appliedAt ?? null,
      application.followUpAt ?? null,
      application.interviewAt ?? null,
      application.notes,
      application.jobDescription ?? "",
      application.draftLm ?? "",
      application.draftMail ?? "",
      application.draftCv ?? "",
      existing?.createdAt ?? null,
    )
    .run();

  const saved = await getApplication(application.id);
  if (!saved) {
    throw new Error("Failed to persist application");
  }
  return saved;
}

export async function deleteApplication(id: string) {
  const db = await getDb();
  await db.prepare("DELETE FROM applications WHERE id = ?").bind(id).run();
}

export function newApplicationId() {
  return crypto.randomUUID();
}
