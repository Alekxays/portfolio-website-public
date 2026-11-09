import { monthsBetween } from "@/lib/cv";

const STALE_MONTHS = 6;
const REMINDER_COOLDOWN_DAYS = 28;

type ReminderRow = {
  last_cv_reminder_at: string | null;
  last_projects_reminder_at: string | null;
};

function daysSince(iso: string | null | undefined, now = new Date()) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
}

async function oldestCvUpdatedAt(db: D1Database) {
  const row = await db
    .prepare("SELECT MIN(updated_at) as m FROM cv_files")
    .first<{ m: string | null }>();
  return row?.m ?? null;
}

async function latestProjectUpdatedAt(db: D1Database) {
  const row = await db
    .prepare("SELECT MAX(updated_at) as m FROM projects")
    .first<{ m: string | null }>();
  return row?.m ?? null;
}

export async function runStudioReminders(env: CloudflareEnv) {
  const to = env.STUDIO_REMINDER_TO?.trim();
  const from = env.STUDIO_REMINDER_FROM?.trim();
  if (!to || !from) {
    console.warn("[studio-reminders] missing STUDIO_REMINDER_TO/FROM");
    return { sent: [] as string[] };
  }
  if (!env.EMAIL) {
    console.warn("[studio-reminders] EMAIL binding missing");
    return { sent: [] as string[] };
  }

  const db = env.DB;
  await db
    .prepare("INSERT OR IGNORE INTO studio_reminders (id) VALUES ('default')")
    .run();

  const state = await db
    .prepare(
      "SELECT last_cv_reminder_at, last_projects_reminder_at FROM studio_reminders WHERE id = 'default'",
    )
    .first<ReminderRow>();

  const sent: string[] = [];
  const now = new Date();
  const fromAddress = { email: from, name: "Studio" };

  const cvUpdated = await oldestCvUpdatedAt(db);
  // Remind only once a CV has been uploaded via Studio (tracks updated_at).
  const cvStale =
    cvUpdated !== null && monthsBetween(cvUpdated, now) >= STALE_MONTHS;
  const canRemindCv =
    daysSince(state?.last_cv_reminder_at, now) >= REMINDER_COOLDOWN_DAYS;

  if (cvStale && canRemindCv) {
    const age = Math.floor(monthsBetween(cvUpdated!, now));
    await env.EMAIL.send({
      to,
      from: fromAddress,
      subject: `Rappel CV — pas mis à jour depuis ${age}+ mois`,
      text: [
        `Ton CV public n'a pas été mis à jour depuis environ ${age} mois.`,
        "",
        "Mets-le à jour dans Studio → Profile / CV :",
        "https://alexandreboissel.me/studio/profile",
        "",
        "— Studio",
      ].join("\n"),
      html: `<p>Ton CV public n'a pas été mis à jour depuis environ <strong>${age} mois</strong>.</p>
<p><a href="https://alexandreboissel.me/studio/profile">Mettre à jour le CV dans Studio</a></p>
<p>— Studio</p>`,
    });
    await db
      .prepare(
        "UPDATE studio_reminders SET last_cv_reminder_at = datetime('now') WHERE id = 'default'",
      )
      .run();
    sent.push("cv");
  }

  const projectUpdated = await latestProjectUpdatedAt(db);
  const projectsStale =
    projectUpdated === null ||
    monthsBetween(projectUpdated, now) >= STALE_MONTHS;
  const canRemindProjects =
    daysSince(state?.last_projects_reminder_at, now) >= REMINDER_COOLDOWN_DAYS;

  if (projectsStale && canRemindProjects) {
    const age =
      projectUpdated === null
        ? STALE_MONTHS
        : Math.floor(monthsBetween(projectUpdated, now));
    await env.EMAIL.send({
      to,
      from: fromAddress,
      subject: `Rappel projets — rien de neuf depuis ${age}+ mois`,
      text: [
        projectUpdated === null
          ? "Aucun projet n'est présent / daté dans Studio."
          : `Aucun projet n'a été ajouté ou mis à jour depuis environ ${age} mois.`,
        "",
        "Ajoute ou mets à jour un projet :",
        "https://alexandreboissel.me/studio/projects",
        "",
        "— Studio",
      ].join("\n"),
      html: `<p>${
        projectUpdated === null
          ? "Aucun projet n'est présent / daté dans Studio."
          : `Aucun projet n'a été ajouté ou mis à jour depuis environ <strong>${age} mois</strong>.`
      }</p>
<p><a href="https://alexandreboissel.me/studio/projects">Ouvrir Studio → Projects</a></p>
<p>— Studio</p>`,
    });
    await db
      .prepare(
        "UPDATE studio_reminders SET last_projects_reminder_at = datetime('now') WHERE id = 'default'",
      )
      .run();
    sent.push("projects");
  }

  return { sent, cvUpdated, projectUpdated };
}
