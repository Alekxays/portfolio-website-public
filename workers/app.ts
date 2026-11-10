/**
 * OpenNext only exports `fetch`. This custom entry adds `scheduled` for
 * Studio freshness reminders (see wrangler.jsonc triggers.crons).
 *
 * `.open-next/worker.js` is produced by `opennextjs-cloudflare build` after
 * `next build`, so this file is excluded from the Next.js TS project and
 * uses @ts-nocheck for the generated import.
 */
// @ts-nocheck
import { default as handler } from "../.open-next/worker.js";
import { runStudioReminders } from "../src/lib/studio-reminders";

export default {
  fetch: handler.fetch,

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      runStudioReminders(env).catch((error) => {
        console.error("[studio-reminders]", error);
      }),
    );
  },
};

// Re-export OpenNext Durable Objects used by the adapter.
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";
