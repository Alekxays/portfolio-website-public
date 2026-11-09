import { emptyProfile, type StudioProfile } from "@/lib/profile";
import { getDb } from "@/lib/db";

type ProfileRow = {
  full_name: string;
  email: string;
  phone: string;
  school: string;
  program: string;
  target_role: string;
  skills: string;
  experience: string;
  cv_text: string;
  tone: string;
  updated_at: string;
};

function rowToProfile(row: ProfileRow): StudioProfile {
  return {
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    school: row.school ?? "",
    program: row.program ?? "",
    targetRole: row.target_role ?? "",
    skills: row.skills ?? "",
    experience: row.experience ?? "",
    cvText: row.cv_text ?? "",
    tone: row.tone || "pro_chaleureux",
    updatedAt: row.updated_at ?? "",
  };
}

export async function getStudioProfile(): Promise<StudioProfile> {
  const db = await getDb();
  await db
    .prepare("INSERT OR IGNORE INTO studio_profile (id) VALUES ('default')")
    .run();
  const row = await db
    .prepare("SELECT * FROM studio_profile WHERE id = 'default'")
    .first<ProfileRow>();
  return row ? rowToProfile(row) : emptyProfile();
}

export async function saveStudioProfile(
  profile: Omit<StudioProfile, "updatedAt">,
): Promise<StudioProfile> {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO studio_profile (
        id, full_name, email, phone, school, program, target_role,
        skills, experience, cv_text, tone, updated_at
      ) VALUES (
        'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        school = excluded.school,
        program = excluded.program,
        target_role = excluded.target_role,
        skills = excluded.skills,
        experience = excluded.experience,
        cv_text = excluded.cv_text,
        tone = excluded.tone,
        updated_at = datetime('now')`,
    )
    .bind(
      profile.fullName,
      profile.email,
      profile.phone,
      profile.school,
      profile.program,
      profile.targetRole,
      profile.skills,
      profile.experience,
      profile.cvText,
      profile.tone || "pro_chaleureux",
    )
    .run();

  return getStudioProfile();
}

export function profileIsReady(profile: StudioProfile) {
  return Boolean(
    profile.fullName.trim() &&
      (profile.cvText.trim() || profile.experience.trim() || profile.skills.trim()),
  );
}
