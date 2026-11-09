export type AnalyticsSnapshot = {
  rangeDays: number;
  requests: number;
  visits: number;
  pageViews: number;
  bytes: number;
  topPaths: Array<{ path: string; requests: number; bytes: number }>;
  topCountries: Array<{ country: string; requests: number }>;
  series: Array<{ day: string; requests: number; visits: number }>;
  source: "cloudflare-graphql" | "unavailable";
  message?: string;
};

type GqlResponse = {
  data?: {
    viewer?: {
      zones?: Array<{
        totals?: Array<{
          count: number;
          sum: {
            visits: number;
            edgeResponseBytes: number;
            edgeResponseContentTypeName?: string;
          };
        }>;
        pageViews?: Array<{ count: number }>;
        topPaths?: Array<{
          count: number;
          sum: { edgeResponseBytes: number };
          dimensions: { metric: string };
        }>;
        topCountries?: Array<{
          count: number;
          dimensions: { metric: string };
        }>;
        series?: Array<{
          count: number;
          sum: { visits: number };
          dimensions: { date: string };
        }>;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
};

function envReady() {
  return Boolean(process.env.CF_API_TOKEN && process.env.CF_ZONE_ID);
}

export async function fetchAnalyticsSnapshot(
  rangeDays = 7,
): Promise<AnalyticsSnapshot> {
  if (!envReady()) {
    return {
      rangeDays,
      requests: 0,
      visits: 0,
      pageViews: 0,
      bytes: 0,
      topPaths: [],
      topCountries: [],
      series: [],
      source: "unavailable",
        message:
          "Configure CF_API_TOKEN and CF_ZONE_ID to load Cloudflare analytics.",
    };
  }

  const end = new Date();
  const start = new Date(end.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const datetime_geq = start.toISOString().replace(/\.\d{3}Z$/, "Z");
  const datetime_lt = end.toISOString().replace(/\.\d{3}Z$/, "Z");
  const zoneTag = process.env.CF_ZONE_ID!;

  const query = `
    query PortfolioAnalytics($zoneTag: String!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          totals: httpRequestsAdaptiveGroups(
            limit: 1
            filter: {
              datetime_geq: "${datetime_geq}"
              datetime_lt: "${datetime_lt}"
              requestSource: "eyeball"
            }
          ) {
            count
            sum { visits edgeResponseBytes }
          }
          pageViews: httpRequestsAdaptiveGroups(
            limit: 1
            filter: {
              datetime_geq: "${datetime_geq}"
              datetime_lt: "${datetime_lt}"
              requestSource: "eyeball"
              edgeResponseContentTypeName: "html"
            }
          ) {
            count
          }
          topPaths: httpRequestsAdaptiveGroups(
            limit: 8
            orderBy: [count_DESC]
            filter: {
              datetime_geq: "${datetime_geq}"
              datetime_lt: "${datetime_lt}"
              requestSource: "eyeball"
            }
          ) {
            count
            sum { edgeResponseBytes }
            dimensions { metric: clientRequestPath }
          }
          topCountries: httpRequestsAdaptiveGroups(
            limit: 8
            orderBy: [count_DESC]
            filter: {
              datetime_geq: "${datetime_geq}"
              datetime_lt: "${datetime_lt}"
              requestSource: "eyeball"
            }
          ) {
            count
            dimensions { metric: clientCountryName }
          }
          series: httpRequestsAdaptiveGroups(
            limit: 40
            orderBy: [date_ASC]
            filter: {
              datetime_geq: "${datetime_geq}"
              datetime_lt: "${datetime_lt}"
              requestSource: "eyeball"
            }
          ) {
            count
            sum { visits }
            dimensions { date }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { zoneTag },
      }),
      next: { revalidate: 300 },
    });

    const json = (await res.json()) as GqlResponse;
    if (!res.ok || json.errors?.length) {
      return {
        rangeDays,
        requests: 0,
        visits: 0,
        pageViews: 0,
        bytes: 0,
        topPaths: [],
        topCountries: [],
        series: [],
        source: "unavailable",
        message:
          json.errors?.map((e) => e.message).join(" · ") ||
          `GraphQL error (${res.status})`,
      };
    }

    const zone = json.data?.viewer?.zones?.[0];
    const totals = zone?.totals?.[0];
    const pageViews = zone?.pageViews?.[0]?.count ?? 0;

    return {
      rangeDays,
      requests: totals?.count ?? 0,
      visits: totals?.sum.visits ?? 0,
      pageViews,
      bytes: totals?.sum.edgeResponseBytes ?? 0,
      topPaths: (zone?.topPaths ?? []).map((row) => ({
        path: row.dimensions.metric || "/",
        requests: row.count,
        bytes: row.sum.edgeResponseBytes,
      })),
      topCountries: (zone?.topCountries ?? []).map((row) => ({
        country: row.dimensions.metric || "Unknown",
        requests: row.count,
      })),
      series: (zone?.series ?? []).map((row) => ({
        day: row.dimensions.date,
        requests: row.count,
        visits: row.sum.visits,
      })),
      source: "cloudflare-graphql",
    };
  } catch (error) {
    return {
      rangeDays,
      requests: 0,
      visits: 0,
      pageViews: 0,
      bytes: 0,
      topPaths: [],
      topCountries: [],
      series: [],
      source: "unavailable",
      message: error instanceof Error ? error.message : "Analytics fetch failed",
    };
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
