import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Durable + cheap for daily free Neurons. */
export const STUDIO_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8" as const;

/** Higher-quality prose (uses more Neurons). */
export const STUDIO_AI_MODEL_QUALITY =
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;

export type StudioGenerateKind = "lm" | "mail" | "cv";

export async function getAi() {
  const { env } = await getCloudflareContext({ async: true });
  const ai = env.AI;
  if (!ai) {
    throw new Error("Workers AI binding AI is not configured");
  }
  return ai;
}

export function extractAiText(result: unknown): string {
  if (!result) return "";
  if (typeof result === "string") return result.trim();
  if (typeof result !== "object") return String(result);

  const record = result as Record<string, unknown>;
  if (typeof record.response === "string") return record.response.trim();

  const choices = record.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const message = (choices[0] as { message?: { content?: unknown } }).message;
    if (typeof message?.content === "string") return message.content.trim();
  }

  return JSON.stringify(result);
}

export async function runStudioChat(options: {
  system: string;
  user: string;
  quality?: boolean;
  maxTokens?: number;
}) {
  const ai = await getAi();
  const messages = [
    { role: "system" as const, content: options.system },
    { role: "user" as const, content: options.user },
  ];
  const max_tokens = options.maxTokens ?? 1800;
  const temperature = 0.55;

  if (options.quality) {
    const result = await ai.run(STUDIO_AI_MODEL_QUALITY, {
      messages,
      max_tokens,
      temperature,
    });
    return { model: STUDIO_AI_MODEL_QUALITY, text: extractAiText(result) };
  }

  const result = await ai.run(STUDIO_AI_MODEL, {
    messages,
    max_tokens,
    temperature,
  });
  return { model: STUDIO_AI_MODEL, text: extractAiText(result) };
}
