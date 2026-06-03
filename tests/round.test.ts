import { describe, expect, it } from "vitest";
import {
  classifyQuestionOutcome,
  percentOf,
  summarizeRound,
  type RoundQuestionResult,
} from "../src/round.ts";

describe("classifyQuestionOutcome", () => {
  it("marks first-try passes", () => {
    expect(classifyQuestionOutcome(true, 1)).toBe("firstTry");
  });

  it("marks passes after retries", () => {
    expect(classifyQuestionOutcome(true, 2)).toBe("retry");
    expect(classifyQuestionOutcome(true, 3)).toBe("retry");
  });

  it("marks exhausted failures as wrong", () => {
    expect(classifyQuestionOutcome(false, 3)).toBe("wrong");
  });
});

describe("summarizeRound", () => {
  it("aggregates outcomes", () => {
    const results: RoundQuestionResult[] = [
      { questionIndex: 0, outcome: "firstTry" },
      { questionIndex: 1, outcome: "firstTry" },
      { questionIndex: 2, outcome: "retry" },
      { questionIndex: 3, outcome: "wrong" },
    ];
    expect(summarizeRound(results)).toEqual({
      results,
      firstTryCount: 2,
      retryCount: 1,
      wrongCount: 1,
      correctCount: 3,
      total: 4,
    });
  });
});

describe("percentOf", () => {
  it("rounds to nearest whole percent", () => {
    expect(percentOf(3, 10)).toBe(30);
    expect(percentOf(1, 3)).toBe(33);
  });

  it("returns zero percent when total is zero", () => {
    expect(percentOf(0, 0)).toBe(0);
  });
});
