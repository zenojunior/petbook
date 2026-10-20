import { z } from "zod";

export const MODERATION_MODEL = "gpt-6-luna";
export const PROMPT_VERSION = "petbook-review-v1";
// Base Decisions input-token price, verified 2026-10-20. Each run stores its rate.
export const DEFAULT_INPUT_USD_PER_MILLION = 0.10;

export type ModerationQuestion = { type: "predicate"; name: string; instructions: string };
export type ModerationInputSnapshot = {
  text: string;
  images: { url: string; labels: string[]; sha256: string; bytes: number }[];
};

const usageSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});

export function readUsage(response: unknown) {
  const parsed = z.object({ usage: usageSchema }).safeParse(response);
  return parsed.success ? parsed.data.usage : null;
}

export function estimateCostUsd(inputTokens: number, inputUsdPerMillion: number): string {
  if (!Number.isSafeInteger(inputTokens) || inputTokens < 0 || !Number.isFinite(inputUsdPerMillion) || inputUsdPerMillion < 0) {
    throw new Error("Invalid token usage or price.");
  }
  return ((inputTokens * inputUsdPerMillion) / 1_000_000).toFixed(10);
}

export function inputTokenRate(value: string | undefined): number {
  if (!value?.trim()) return DEFAULT_INPUT_USD_PER_MILLION;
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 10000) throw new Error("Invalid Decisions input-token price.");
  return rate;
}
