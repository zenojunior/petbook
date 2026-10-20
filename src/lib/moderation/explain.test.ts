import { describe, expect, it } from "vitest";
import { explainChecks, explainDecision } from "./explain";

const answers = (values: number[]) =>
  ["pet_story", "test_or_spam", "unsafe_content", "private_information"].map((name, i) => ({ name, probability: values[i] }));

describe("explainChecks", () => {
  it("marks each check as passed, unsure or failed against its own cut-offs", () => {
    const checks = explainChecks(answers([0.5, 0.5, 0.5, 0.5]));
    expect(checks.map((c) => c.verdict)).toEqual(["unsure", "unsure", "unsure", "unsure"]);
    expect(explainChecks(answers([0.95, 0, 0, 0])).map((c) => c.verdict)).toEqual(["pass", "pass", "pass", "pass"]);
    expect(explainChecks(answers([0, 1, 1, 1])).map((c) => c.verdict)).toEqual(["fail", "fail", "fail", "fail"]);
  });

  it("skips a question the reviewer did not answer", () => {
    expect(explainChecks([{ name: "pet_story", probability: 1 }])).toHaveLength(1);
  });
});

describe("explainDecision", () => {
  it("names the checks that sent the book to a person", () => {
    const text = explainDecision("needs_human", explainChecks(answers([0.1, 0, 0, 0])));
    expect(text).toContain("it is a story about a pet");
  });

  it("says a person decides when an answer is missing", () => {
    expect(explainDecision("needs_human", [])).toContain("did not return every answer");
  });
});
