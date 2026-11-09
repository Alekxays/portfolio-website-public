#!/usr/bin/env node
/**
 * Local / check: plain Next.js build.
 * Workers Builds (`WORKERS_CI=1`): full OpenNext adapt so `wrangler deploy`
 * finds `.open-next/` (compiled config + worker.js).
 *
 * open-next.config.ts sets `buildCommand: "npx next build"` so the adapter
 * does not re-enter this script via `npm run build`.
 */
import { spawnSync } from "node:child_process";

const onWorkersCi = process.env.WORKERS_CI === "1";
const args = onWorkersCi
	? ["opennextjs-cloudflare", "build"]
	: ["next", "build"];

const result = spawnSync("npx", args, {
	stdio: "inherit",
	shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
