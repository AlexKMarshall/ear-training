import { describe, expect, it } from "vitest";
import {
  classifyExerciseOutcome,
  type LessonExerciseResult,
  percentOf,
  summarizeLesson,
} from "../src/lesson.ts";

describe("classifyExerciseOutcome", () => {
  it("marks first-try passes", () => {
    expect(classifyExerciseOutcome(true, 1)).toBe("firstTry");
  });

  it("marks passes after retries", () => {
    expect(classifyExerciseOutcome(true, 2)).toBe("retry");
    expect(classifyExerciseOutcome(true, 3)).toBe("retry");
  });

  it("marks exhausted failures as wrong", () => {
    expect(classifyExerciseOutcome(false, 3)).toBe("wrong");
  });
});

describe("summarizeLesson", () => {
  it("aggregates outcomes", () => {
    const results: LessonExerciseResult[] = [
      { exerciseIndex: 0, outcome: "firstTry" },
      { exerciseIndex: 1, outcome: "firstTry" },
      { exerciseIndex: 2, outcome: "retry" },
      { exerciseIndex: 3, outcome: "wrong" },
    ];
    expect(summarizeLesson(results)).toEqual({
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
