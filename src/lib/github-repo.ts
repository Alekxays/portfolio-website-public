export type GithubRepoSnapshot = {
  owner: string;
  repo: string;
  htmlUrl: string;
  homepage: string | null;
  description: string | null;
  topics: string[];
  language: string | null;
  languages: Record<string, number>;
  createdAt: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
  defaultBranch: string | null;
  readme: string;
  packageJson: {
    name?: string;
    description?: string;
    dependencies?: string[];
    devDependencies?: string[];
    scripts?: string[];
  } | null;
};

function getGithubToken() {
  return (
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GH_TOKEN?.trim() ||
    undefined
  );
}

export function parseGithubRepoInput(input: string): {
  owner: string;
  repo: string;
} | null {
  const raw = input.trim().replace(/\.git$/i, "");
  if (!raw) return null;

  const shorthand = raw.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (shorthand) {
    return { owner: shorthand[1], repo: shorthand[2] };
  }

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!/(^|\.)github\.com$/i.test(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/i, ""),
    };
  } catch {
    return null;
  }
}

async function githubFetch(path: string, accept?: string) {
  const headers: Record<string, string> = {
    Accept: accept ?? "application/vnd.github+json",
    "User-Agent": "portfolio-studio-github-import",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = getGithubToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com${path}`, {
    headers,
    // Avoid Next caching stale repo metadata during studio imports.
    cache: "no-store",
  });
  return res;
}

function truncate(text: string, max = 8000) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated]`;
}

function topDependencyNames(
  deps: Record<string, string> | undefined,
  limit = 24,
) {
  if (!deps) return [];
  return Object.keys(deps).slice(0, limit);
}

function summarizePackageJson(
  raw: string,
): GithubRepoSnapshot["packageJson"] {
  try {
    const pkg = JSON.parse(raw) as {
      name?: string;
      description?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    return {
      name: pkg.name,
      description: pkg.description,
      dependencies: topDependencyNames(pkg.dependencies),
      devDependencies: topDependencyNames(pkg.devDependencies, 16),
      scripts: pkg.scripts ? Object.keys(pkg.scripts).slice(0, 12) : [],
    };
  } catch {
    return null;
  }
}

export type ManualGithubRepoInput = {
  url: string;
  readme?: string;
  packageJson?: string;
  description?: string;
  homepage?: string;
  language?: string;
  languages?: string;
  topics?: string;
  year?: string;
};

/** Build a snapshot from pasted local files when the GitHub API is blocked. */
export function buildManualGithubSnapshot(
  input: ManualGithubRepoInput,
): GithubRepoSnapshot {
  const parsed = parseGithubRepoInput(input.url);
  if (!parsed) {
    throw new Error("Invalid GitHub URL or owner/repo");
  }

  const readme = truncate((input.readme ?? "").trim(), 9000);
  const packageRaw = (input.packageJson ?? "").trim();
  const packageJson = packageRaw ? summarizePackageJson(packageRaw) : null;
  if (packageRaw && !packageJson) {
    throw new Error("package.json paste is not valid JSON");
  }

  const languageList = (input.languages ?? "")
    .split(/[,|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const languages: Record<string, number> = {};
  languageList.forEach((name, index) => {
    languages[name] = Math.max(1, languageList.length - index);
  });

  const topics = (input.topics ?? "")
    .split(/[,|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const year = (input.year ?? "").trim();
  const createdAt = /^\d{4}$/.test(year) ? `${year}-01-01T00:00:00Z` : null;

  if (!readme && !packageJson && !(input.description ?? "").trim()) {
    throw new Error(
      "Paste at least a README, package.json, or short description",
    );
  }

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    htmlUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
    homepage: (input.homepage ?? "").trim() || null,
    description:
      (input.description ?? "").trim() ||
      packageJson?.description ||
      null,
    topics,
    language: (input.language ?? "").trim() || languageList[0] || null,
    languages,
    createdAt,
    updatedAt: null,
    pushedAt: null,
    defaultBranch: null,
    readme,
    packageJson,
  };
}

export async function fetchGithubRepoSnapshot(
  input: string,
): Promise<GithubRepoSnapshot> {
  const parsed = parseGithubRepoInput(input);
  if (!parsed) {
    throw new Error("Invalid GitHub URL or owner/repo");
  }

  const { owner, repo } = parsed;
  const repoRes = await githubFetch(`/repos/${owner}/${repo}`);
  if (repoRes.status === 404) {
    throw new Error("Repository not found (private repos need GITHUB_TOKEN)");
  }
  if (repoRes.status === 403) {
    throw new Error("GitHub API rate limit or forbidden - set GITHUB_TOKEN");
  }
  if (!repoRes.ok) {
    throw new Error(`GitHub repo fetch failed (${repoRes.status})`);
  }

  const repoJson = (await repoRes.json()) as {
    html_url?: string;
    homepage?: string | null;
    description?: string | null;
    topics?: string[];
    language?: string | null;
    created_at?: string;
    updated_at?: string;
    pushed_at?: string;
    default_branch?: string;
  };

  const [languagesRes, readmeRes, packageRes] = await Promise.all([
    githubFetch(`/repos/${owner}/${repo}/languages`),
    githubFetch(
      `/repos/${owner}/${repo}/readme`,
      "application/vnd.github.raw",
    ),
    githubFetch(`/repos/${owner}/${repo}/contents/package.json`),
  ]);

  let languages: Record<string, number> = {};
  if (languagesRes.ok) {
    languages = (await languagesRes.json()) as Record<string, number>;
  }

  let readme = "";
  if (readmeRes.ok) {
    readme = truncate(await readmeRes.text(), 9000);
  }

  let packageJson: GithubRepoSnapshot["packageJson"] = null;
  if (packageRes.ok) {
    const contentJson = (await packageRes.json()) as {
      content?: string;
      encoding?: string;
    };
    if (contentJson.content && contentJson.encoding === "base64") {
      const decoded = atob(contentJson.content.replace(/\n/g, ""));
      packageJson = summarizePackageJson(decoded);
    }
  }

  return {
    owner,
    repo,
    htmlUrl: repoJson.html_url || `https://github.com/${owner}/${repo}`,
    homepage: repoJson.homepage || null,
    description: repoJson.description || null,
    topics: Array.isArray(repoJson.topics) ? repoJson.topics : [],
    language: repoJson.language || null,
    languages,
    createdAt: repoJson.created_at || null,
    updatedAt: repoJson.updated_at || null,
    pushedAt: repoJson.pushed_at || null,
    defaultBranch: repoJson.default_branch || null,
    readme,
    packageJson,
  };
}
