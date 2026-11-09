# Deploy (Cloudflare Workers + OpenNext)

This app deploys with [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Deploy needs the **OpenNext** output under `.open-next/` (not only `.next/`).

## Local

```bash
npm run deploy
# = opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

Preview in the Workers runtime:

```bash
npm run preview
```

## Workers Builds (Git)

Dashboard → Worker → **Settings → Build**. Cloudflare often auto-detects `npm run build` + `npx wrangler deploy`. That fails with:

> Could not find compiled Open Next config, did you run the build command?

because plain `next build` never creates `.open-next/`.

### Recommended settings

| Setting | Command |
| --- | --- |
| **Build command** | `npx opennextjs-cloudflare build` (or `npm run build:worker`) |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |
| **Preview / non-prod** | `npx opennextjs-cloudflare upload` |

Alternatively, set **Deploy command** to `npm run deploy` and leave **Build command** empty (the script builds then deploys).

### Repo safety net

`npm run build` runs plain `next build` locally. On Workers CI (`WORKERS_CI=1`) it runs `opennextjs-cloudflare build` instead, so the default dashboard pair (`npm run build` + `npx wrangler deploy`) produces `.open-next/` before deploy.

Prefer the recommended settings above so CI does not rely on that hook.

## Secrets / vars

- **Build-time** (SSG / `NEXT_PUBLIC_*`): Workers Builds → Build variables and secrets
- **Runtime**: Worker → Settings → Variables and Secrets (and `.dev.vars` locally)

See [studio.md](./studio.md) for Access + analytics secrets.
