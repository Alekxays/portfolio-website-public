import type { Project, ProjectLink, ProjectStatus } from "@/content/projects";
import { runStudioChat } from "@/lib/ai";
import type { GithubRepoSnapshot } from "@/lib/github-repo";
import { slugifyId } from "@/lib/projects-store";

type AiProjectDraft = {
  title?: string;
  year?: string;
  status?: ProjectStatus;
  skills?: string[];
  summary?: { fr?: string; en?: string };
  pitch?: { fr?: string; en?: string };
};

function yearFromIso(iso: string | null) {
  if (!iso) return String(new Date().getFullYear());
  const y = new Date(iso).getFullYear();
  return Number.isFinite(y) ? String(y) : String(new Date().getFullYear());
}

function languageSkills(snapshot: GithubRepoSnapshot) {
  const ranked = Object.entries(snapshot.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  const fromPkg = [
    ...(snapshot.packageJson?.dependencies ?? []),
    ...(snapshot.packageJson?.devDependencies ?? []),
  ];
  const mapped: string[] = [];
  for (const name of fromPkg) {
    const n = name.toLowerCase();
    if (n === "react" || n === "react-dom") mapped.push("React");
    else if (n === "next") mapped.push("Next.js");
    else if (n === "typescript") mapped.push("TypeScript");
    else if (n.includes("tailwind")) mapped.push("Tailwind CSS");
    else if (n === "firebase") mapped.push("Firebase");
    else if (n.includes("three")) mapped.push("Three.js");
    else if (n.includes("expo")) mapped.push("Expo");
  }

  return Array.from(
    new Set(
      [
        ...ranked.slice(0, 5),
        ...mapped,
        ...(snapshot.language ? [snapshot.language] : []),
        ...snapshot.topics.map((t) => t.replace(/-/g, " ")),
      ]
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

function extractJsonObject(text: string): AiProjectDraft | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as AiProjectDraft;
  } catch {
    return null;
  }
}

function buildLinks(snapshot: GithubRepoSnapshot): ProjectLink[] {
  const links: ProjectLink[] = [{ type: "github", url: snapshot.htmlUrl }];
  if (snapshot.homepage) {
    links.push({ type: "website", url: snapshot.homepage });
  }
  return links;
}

export async function draftProjectFromGithub(options: {
  snapshot: GithubRepoSnapshot;
  quality?: boolean;
}): Promise<{ project: Project; model: string; source: GithubRepoSnapshot }> {
  const { snapshot } = options;
  const fallbackSkills = languageSkills(snapshot);
  const fallbackTitle =
    snapshot.packageJson?.name?.replace(/^@[^/]+\//, "") || snapshot.repo;
  const fallbackYear = yearFromIso(snapshot.createdAt || snapshot.pushedAt);

  const context = [
    `Repo: ${snapshot.owner}/${snapshot.repo}`,
    `URL: ${snapshot.htmlUrl}`,
    snapshot.homepage ? `Homepage: ${snapshot.homepage}` : "",
    snapshot.description ? `GitHub description: ${snapshot.description}` : "",
    snapshot.topics.length ? `Topics: ${snapshot.topics.join(", ")}` : "",
    snapshot.language ? `Primary language: ${snapshot.language}` : "",
    Object.keys(snapshot.languages).length
      ? `Languages: ${Object.entries(snapshot.languages)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k}(${v})`)
          .join(", ")}`
      : "",
    snapshot.packageJson
      ? `package.json: ${JSON.stringify(snapshot.packageJson)}`
      : "No package.json",
    snapshot.readme ? `README:\n${snapshot.readme}` : "No README",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { model, text } = await runStudioChat({
    quality: options.quality,
    maxTokens: 1400,
    system: `Tu es un assistant portfolio. À partir d'un dépôt GitHub, tu produis un projet portfolio bilingue.
Réponds UNIQUEMENT avec un JSON valide (pas de markdown) de la forme:
{
  "title": "string",
  "year": "YYYY",
  "status": "ongoing"|"paused"|"finished",
  "skills": ["string"],
  "summary": { "fr": "1 phrase", "en": "1 sentence" },
  "pitch": { "fr": "2-4 phrases", "en": "2-4 sentences" }
}
Règles:
- N'invente pas de stack absente des sources
- Skills: 4 à 10 technos concrètes
- Ton éditorial, clair, sans jargon marketing vide
- status=finished si le repo semble abouti/archivé, sinon ongoing`,
    user: context,
  });

  const parsed = extractJsonObject(text);
  const status: ProjectStatus =
    parsed?.status === "paused" ||
    parsed?.status === "finished" ||
    parsed?.status === "ongoing"
      ? parsed.status
      : "finished";

  const skills =
    Array.isArray(parsed?.skills) && parsed.skills.length
      ? parsed.skills.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12)
      : fallbackSkills;

  const title = String(parsed?.title ?? fallbackTitle).trim() || fallbackTitle;
  const year = String(parsed?.year ?? fallbackYear).trim() || fallbackYear;

  const project: Project = {
    id: slugifyId(title) || slugifyId(snapshot.repo) || snapshot.repo.toLowerCase(),
    title,
    year,
    status,
    skills,
    summary: {
      fr: String(parsed?.summary?.fr ?? snapshot.description ?? title).trim(),
      en: String(parsed?.summary?.en ?? snapshot.description ?? title).trim(),
    },
    pitch: {
      fr: String(
        parsed?.pitch?.fr ??
          snapshot.description ??
          `Projet ${title} - dépôt GitHub ${snapshot.owner}/${snapshot.repo}.`,
      ).trim(),
      en: String(
        parsed?.pitch?.en ??
          snapshot.description ??
          `Project ${title} - GitHub repository ${snapshot.owner}/${snapshot.repo}.`,
      ).trim(),
    },
    links: buildLinks(snapshot),
  };

  return { project, model, source: snapshot };
}
