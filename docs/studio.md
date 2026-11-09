# Studio (hidden admin)

Hidden admin surface at `/studio`.

## Access combo

1. **Easter egg** — click the brand name in the header **7 times** within ~3s → navigates to `/studio`.
2. **Cloudflare Access** (recommended in production) — protect `https://your-domain/studio*` in Zero Trust:
   - Cloudflare One → Access → Applications → Add self-hosted app
   - Application domain: your portfolio hostname
   - Path: `/studio*`
   - Policy: allow your email / IdP group
   - Copy **Application Audience (AUD)** and team domain
3. **Origin verification** — set secrets so the app re-validates the Access JWT:
   - `CF_ACCESS_TEAM_DOMAIN=https://<team>.cloudflareaccess.com`
   - `CF_ACCESS_AUD=<aud tag>`
4. **Local fallback** — if Access vars are unset, `/studio/login` accepts `STUDIO_DEV_PASSWORD`.
   - For `next dev`, put it in **`.env.local`** (Next only loads `.env*`, not `.dev.vars`).
   - Keep the same value in **`.dev.vars`** for Wrangler / OpenNext preview.

## D1 projects + applications

```bash
npx wrangler d1 create portfolio-studio
# put the returned database_id into wrangler.jsonc
npx wrangler d1 migrations apply portfolio-studio --local
npx wrangler d1 migrations apply portfolio-studio --remote
npx wrangler types --env-interface CloudflareEnv env.d.ts
```

On first read, an empty projects table is seeded from `src/content/projects.ts`.

### Applications (alternance / jobs)

Studio → **Applications** (`/studio/applications`): private pipeline over D1.

| Field | Notes |
| --- | --- |
| company, role | required |
| status | `todo` · `applied` · `interview` · `offer` · `rejected` · `ghosted` |
| channel | `linkedin` · `website` · `email` · `referral` · `other` |
| url, location | optional |
| applied / follow-up / interview dates | optional (`YYYY-MM-DD`) |
| notes | free text |

API: `GET/POST/PUT/DELETE /api/studio/applications` (same Access / studio session as projects).

### Profile + AI drafts (Workers AI)

1. Fill **Studio → Profile** (`/studio/profile`) once: name, school, skills, experience, CV text.
2. On an application: paste the job description, save, then use separate buttons:
   - **Generate LM** — lettre de motivation
   - **Generate Mail** / **Relance** — e-mail candidature or follow-up
   - **Generate CV** — bullets / compétences adaptés à l’offre
3. Optional checkbox **Quality model (70B)** for better prose (uses more Neurons).

Binding in `wrangler.jsonc`: `"ai": { "binding": "AI" }`.  
Default model: `@cf/meta/llama-3.1-8b-instruct-fp8` · quality: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.  
Free allocation: 10 000 Neurons/day ([Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)).

APIs:
- `GET/PUT /api/studio/profile`
- `POST /api/studio/generate` `{ applicationId, kind: "lm"|"mail"|"cv", mailKind?, quality?, jobDescription? }`

### Public CV upload (Hero download)

On **Profile**, upload FR / EN PDFs. They replace the static files for `/cv/fr` and `/cv/en` (Hero “Download CV”). Stored in KV (`CV_STORE`); metadata in D1 `cv_files`. Reset falls back to `public/files/…`.

API: `GET/POST/DELETE /api/studio/cv`

### Freshness reminders (email)

Weekly cron (`0 9 * * 1` UTC) via custom worker `workers/app.ts`:

- CV uploaded via Studio older than **6 months** → email reminder
- No project create/update for **6 months** → email reminder
- Cooldown **28 days** between identical reminders

Requires Cloudflare **Email Sending** onboarded for `alexandreboissel.me`, binding `EMAIL`, and vars:

- `STUDIO_REMINDER_TO` (default `hey@alexandreboissel.me`)
- `STUDIO_REMINDER_FROM` (default `studio@alexandreboissel.me`)

Enable sending (Dashboard → Email Service → Email Sending → onboard domain), or:

```bash
npx wrangler email sending enable alexandreboissel.me
```

(Your OAuth token needs Email Sending permissions; re-run `npx wrangler login` if you get Unauthorized.)

## Analytics (Cloudflare GraphQL)

Create an API token with permissions to read zone analytics / Account Analytics, then set:

- `CF_ANALYTICS_API_TOKEN` (not `CF_API_TOKEN` — that name is hijacked by Wrangler for CLI auth)
- `CF_ZONE_ID`
- `CF_ANALYTICS_ACCOUNT_ID` (optional)

Studio Overview calls `httpRequestsAdaptiveGroups` (requests, visits, HTML page views, bandwidth, top paths, top countries).

For `next dev`, these must also be in **`.env.local`** (uncommented). `.dev.vars` alone is ignored by Next.

## Local secrets

Copy `.dev.vars.example` → `.dev.vars` for `wrangler` / OpenNext local bindings.
Mirror analytics + studio password into `.env.local` for `next dev`.
