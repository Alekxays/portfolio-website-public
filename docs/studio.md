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

## D1 projects

```bash
npx wrangler d1 create portfolio-studio
# put the returned database_id into wrangler.jsonc
npx wrangler d1 migrations apply portfolio-studio --local
npx wrangler d1 migrations apply portfolio-studio --remote
npx wrangler types --env-interface CloudflareEnv env.d.ts
```

On first read, an empty DB is seeded from `src/content/projects.ts`.

## Analytics (Cloudflare GraphQL)

Create an API token with permissions to read zone analytics / Account Analytics, then set:

- `CF_API_TOKEN`
- `CF_ZONE_ID`
- `CF_ACCOUNT_ID` (optional, useful for account-scoped tokens)

Studio Overview calls `httpRequestsAdaptiveGroups` (requests, visits, HTML page views, bandwidth, top paths, top countries).

For `next dev`, these must also be in **`.env.local`** (uncommented). `.dev.vars` alone is ignored by Next.

## Local secrets

Copy `.dev.vars.example` → `.dev.vars` for `wrangler` / OpenNext local bindings.
Mirror analytics + studio password into `.env.local` for `next dev`.
