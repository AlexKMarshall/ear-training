import { describe, expect, it } from "vitest";
import { getIntervalById } from "../src/interval-config.ts";
import {
  buildIntervalQuestion,
  intervalToSingTestQuestion,
  validLowerMidis,
} from "../src/interval-questions.ts";

describe("validLowerMidis", () => {
  it("fits perfect fifth within a tenor-like range", () => {
    const lowers = validLowerMidis({ lowMidi: 48, highMidi: 67 }, 7);
    expect(lowers.length).toBeGreaterThan(0);
    expect(Math.max(...lowers) + 7).toBeLessThanOrEqual(67);
  });

  it("returns empty when octave does not fit", () => {
    const lowers = validLowerMidis({ lowMidi: 60, highMidi: 65 }, 12);
    expect(lowers).toEqual([]);
  });
});

describe("buildIntervalQuestion", () => {
  it("sets upper note as sing target", () => {
    const fifth = getIntervalById("perfect-fifth")!;
    const question = buildIntervalQuestion(fifth, "melodic", 60);
    const sing = intervalToSingTestQuestion(question);
    expect(sing.target.midi).toBe(67);
    expect(question.lower.midi).toBe(60);
    expect(question.intervalId).toBe("perfect-fifth");
  });
});
