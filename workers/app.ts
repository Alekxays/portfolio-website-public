/**
 * OpenNext only exports `fetch`. This custom entry adds `scheduled` for
 * Studio freshness reminders (see wrangler.jsonc triggers.crons).
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore generated at build time
import { default as handler } from "../.open-next/worker.js";
import { runStudioReminders } from "../src/lib/studio-reminders";

export default {
  fetch: handler.fetch,

  async scheduled(
    _controller: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      runStudioReminders(env).catch((error: unknown) => {
        console.error("[studio-reminders]", error);
      }),
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;

// Re-export OpenNext Durable Objects used by the adapter.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore generated at build time
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";
