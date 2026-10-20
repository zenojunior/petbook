import { checkVerdict, questionNames, THRESHOLDS, type CheckVerdict } from "./parse-moderation";

type QuestionName = (typeof questionNames)[number];

export type Check = {
  name: QuestionName;
  label: string;
  probability: number;
  verdict: CheckVerdict;
  // The cut-offs in plain words, for the admin screen.
  rule: string;
};

const labels: Record<QuestionName, string> = {
  pet_story: "It is a story about a pet",
  test_or_spam: "It is test content or spam",
  unsafe_content: "It has unsafe content",
  private_information: "It shows personal information",
};

function percent(value: number): string {
  return `${Number((value * 100).toFixed(1))}%`;
}

function ruleOf(name: QuestionName): string {
  if (name === "pet_story") {
    const t = THRESHOLDS.pet_story;
    return `Passes at ${percent(t.passAtLeast)} or more. Rejected at ${percent(t.failAtMost)} or less.`;
  }
  const t = THRESHOLDS[name];
  return `Passes at ${percent(t.passAtMost)} or less. Rejected at ${percent(t.failAtLeast)} or more.`;
}

// Turns the reviewer's answers into one row per check, in a fixed order. A check is missing from
// the result when the reviewer did not answer it.
export function explainChecks(answers: { name: string | null; probability?: number }[]): Check[] {
  return questionNames.flatMap((name) => {
    const answer = answers.find((a) => a.name === name);
    if (answer?.probability === undefined) return [];
    return [{ name, label: labels[name], probability: answer.probability, verdict: checkVerdict(name, answer.probability), rule: ruleOf(name) }];
  });
}

// One sentence on why the book ended where it did.
export function explainDecision(decision: "approve" | "reject" | "needs_human", checks: Check[]): string {
  if (checks.length < questionNames.length) return "The reviewer did not return every answer, so a person has to decide.";
  const named = (verdict: CheckVerdict) => checks.filter((c) => c.verdict === verdict).map((c) => c.label.toLowerCase());
  if (decision === "approve") return "All four checks passed, so the book was published without a person.";
  if (decision === "reject") return `Rejected because of: ${named("fail").join("; ")}.`;
  return `Not sure enough to decide alone. Needs a person: ${named("unsure").join("; ")}.`;
}
