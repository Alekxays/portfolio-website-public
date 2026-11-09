import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getDb() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = env.DB;
    if (!db) {
      throw new Error("D1 binding DB is not configured");
    }
    return db;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Unable to access Cloudflare D1 context");
  }
}
