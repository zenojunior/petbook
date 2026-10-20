import { z } from "zod";

export type ModerationResult = {
  decision: "approve" | "reject" | "needs_human";
  reasons: string[];
};

export const questionNames = ["pet_story", "test_or_spam", "unsafe_content", "private_information"] as const;
const responseSchema = z.object({
  answers: z.array(z.object({
    type: z.literal("predicate"),
    name: z.enum(questionNames),
    probability: z.number().finite().min(0).max(1),
  })).length(questionNames.length),
});

export function parseModeration(input: unknown): ModerationResult {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.answers.map((a) => a.name)).size !== questionNames.length) {
    return { decision: "needs_human", reasons: ["The automatic reviewer returned an incomplete or invalid answer."] };
  }
  const probabilities = Object.fromEntries(parsed.data.answers.map((a) => [a.name, a.probability]));
  const reasons: string[] = [];
  if (probabilities.pet_story <= 0.02) reasons.push("The book does not appear to tell a pet's story.");
  if (probabilities.test_or_spam >= 0.98) reasons.push("The book appears to contain test content, placeholders or spam.");
  if (probabilities.unsafe_content >= 0.98) reasons.push("The book appears to contain content unsuitable for a public pet library.");
  if (probabilities.private_information >= 0.98) reasons.push("The book appears to expose sensitive personal information.");
  if (probabilities.pet_story >= 0.98 && probabilities.test_or_spam <= 0.02 && probabilities.unsafe_content <= 0.01 && probabilities.private_information <= 0.01) {
    return { decision: "approve", reasons: ["The book appears to be a pet story, without test content, spam, unsafe content or sensitive personal information."] };
  }
  if (reasons.length) return { decision: "reject", reasons };
  return { decision: "needs_human", reasons: ["The automatic reviewer was uncertain. A human needs to check this book."] };
}
