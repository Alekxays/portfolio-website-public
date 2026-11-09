import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Use `npx next build` instead of `npm run build` so OpenNext does not
 * re-enter the npm lifecycle (and our Workers CI postbuild) while adapting.
 */
export default {
	...defineCloudflareConfig({
		// Uncomment to enable R2 cache,
		// It should be imported as:
		// `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
		// See https://opennext.js.org/cloudflare/caching for more details
		// incrementalCache: r2IncrementalCache,
	}),
	buildCommand: "npx next build",
};
