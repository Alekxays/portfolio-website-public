import { NextResponse } from "next/server";
import { requireStudioIdentity } from "@/lib/access";
import {
  buildManualGithubSnapshot,
  fetchGithubRepoSnapshot,
} from "@/lib/github-repo";
import { draftProjectFromGithub } from "@/lib/project-from-github";

export async function POST(request: Request) {
  const identity = await requireStudioIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    url?: string;
    quality?: boolean;
    manual?: boolean;
    readme?: string;
    packageJson?: string;
    description?: string;
    homepage?: string;
    language?: string;
    languages?: string;
    topics?: string;
    year?: string;
  } | null;

  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json(
      { error: "url is required (GitHub URL or owner/repo)" },
      { status: 400 },
    );
  }

  try {
    const snapshot = body?.manual
      ? buildManualGithubSnapshot({
          url,
          readme: body.readme,
          packageJson: body.packageJson,
          description: body.description,
          homepage: body.homepage,
          language: body.language,
          languages: body.languages,
          topics: body.topics,
          year: body.year,
        })
      : await fetchGithubRepoSnapshot(url);

    const { project, model } = await draftProjectFromGithub({
      snapshot,
      quality: Boolean(body?.quality),
    });

    return NextResponse.json({
      project,
      model,
      mode: body?.manual ? "manual" : "api",
      source: {
        owner: snapshot.owner,
        repo: snapshot.repo,
        htmlUrl: snapshot.htmlUrl,
        description: snapshot.description,
        language: snapshot.language,
        topics: snapshot.topics,
        hasReadme: Boolean(snapshot.readme),
        hasPackageJson: Boolean(snapshot.packageJson),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitHub import failed";
    const status = /not found|invalid github/i.test(message)
      ? 404
      : /rate limit|forbidden/i.test(message)
        ? 429
        : /paste at least|not valid json/i.test(message)
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
