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

// The cut-offs in one place, so the decision and the admin screen that explains it agree.
// pet_story is the only "true is good" question; the other three are "true is bad".
// Between the two cut-offs of a question the reviewer is unsure and a human decides.
export const THRESHOLDS = {
  pet_story: { passAtLeast: 0.9, failAtMost: 0.02 },
  test_or_spam: { passAtMost: 0.1, failAtLeast: 0.98 },
  unsafe_content: { passAtMost: 0.05, failAtLeast: 0.98 },
  private_information: { passAtMost: 0.05, failAtLeast: 0.98 },
} as const;

export type CheckVerdict = "pass" | "unsure" | "fail";

export function checkVerdict(name: (typeof questionNames)[number], probability: number): CheckVerdict {
  if (name === "pet_story") {
    const t = THRESHOLDS.pet_story;
    return probability >= t.passAtLeast ? "pass" : probability <= t.failAtMost ? "fail" : "unsure";
  }
  const t = THRESHOLDS[name];
  return probability <= t.passAtMost ? "pass" : probability >= t.failAtLeast ? "fail" : "unsure";
}

export function parseModeration(input: unknown): ModerationResult {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.answers.map((a) => a.name)).size !== questionNames.length) {
    return { decision: "needs_human", reasons: ["The automatic reviewer returned an incomplete or invalid answer."] };
  }
  const verdicts = Object.fromEntries(parsed.data.answers.map((a) => [a.name, checkVerdict(a.name, a.probability)]));
  const reasons: string[] = [];
  if (verdicts.pet_story === "fail") reasons.push("The book does not appear to tell a pet's story.");
  if (verdicts.test_or_spam === "fail") reasons.push("The book appears to contain test content, placeholders or spam.");
  if (verdicts.unsafe_content === "fail") reasons.push("The book appears to contain content unsuitable for a public pet library.");
  if (verdicts.private_information === "fail") reasons.push("The book appears to expose sensitive personal information.");
  if (questionNames.every((name) => verdicts[name] === "pass")) {
    return { decision: "approve", reasons: ["The book appears to be a pet story, without test content, spam, unsafe content or sensitive personal information."] };
  }
  if (reasons.length) return { decision: "reject", reasons };
  return { decision: "needs_human", reasons: ["The automatic reviewer was uncertain. A human needs to check this book."] };
}
