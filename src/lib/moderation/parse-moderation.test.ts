import { describe, expect, it } from "vitest";
import { parseModeration, questionNames } from "./parse-moderation";
const answer = (values: number[]) => ({ answers: questionNames.map((name, i) => ({ name, type: "predicate", probability: values[i] })) });
describe("Decisions moderation", () => {
  it("approves only a clearly appropriate pet story", () => expect(parseModeration(answer([0.99, 0.01, 0.001, 0.001])).decision).toBe("approve"));
  it("rejects clear test content", () => expect(parseModeration(answer([0.1, 0.99, 0, 0])).decision).toBe("reject"));
  it("rejects unsafe content even in a pet story", () => expect(parseModeration(answer([0.99, 0.01, 0.99, 0])).decision).toBe("reject"));
  it("rejects sensitive information", () => expect(parseModeration(answer([0.99, 0.01, 0, 0.99])).decision).toBe("reject"));
  it("routes uncertainty to a human", () => expect(parseModeration(answer([0.8, 0.2, 0.1, 0.1])).decision).toBe("needs_human"));
  it("approves a pet story the reviewer is confident about, even if not certain", () => expect(parseModeration(answer([0.92, 0.08, 0.03, 0.02])).decision).toBe("approve"));
  it("sends a book to a human when pet_story is low but not clearly wrong", () => expect(parseModeration(answer([0.1, 0, 0, 0])).decision).toBe("needs_human"));
  it("rejects a book that is clearly not about a pet", () => expect(parseModeration(answer([0.01, 0, 0, 0])).decision).toBe("reject"));
  it.each([null, {}, { answers: [] }, { answers: [{ type: "refusal", name: "pet_story" }] }, answer([2, 0, 0, 0]), answer([NaN, 0, 0, 0])])("fails safe on invalid or refused results: %j", (input) => expect(parseModeration(input).decision).toBe("needs_human"));
  it("rejects duplicate answers with missing questions", () => {
    const input = answer([1, 0, 0, 0]);
    input.answers[1].name = "pet_story";
    expect(parseModeration(input).decision).toBe("needs_human");
  });
  it("matches answers by name rather than response order", () => {
    const input = answer([0.99, 0.01, 0, 0]);
    input.answers.reverse();
    expect(parseModeration(input).decision).toBe("approve");
  });
});
