import { describe, expect, it } from "vitest";
import {
  DIATONIC_MAJOR_INTERVAL_IDS,
  getIntervalById,
  INTERVAL_2A_IDS,
} from "../src/interval-config.ts";
import {
  buildIntervalChoices,
  buildIntervalExercise,
  intervalToLessonExercise,
  randomIntervalExercise,
  randomIntervalExerciseForTag,
  validLowerMidis,
} from "../src/interval-exercises.ts";

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

  it("can be sparse for minor second in a narrow range", () => {
    const lowers = validLowerMidis({ lowMidi: 60, highMidi: 61 }, 1);
    expect(lowers).toEqual([60]);
  });
});

describe("buildIntervalExercise", () => {
  it("sets upper note as sing target", () => {
    const fifth = getIntervalById("perfect-fifth")!;
    const exercise = buildIntervalExercise(fifth, "melodic", 60);
    const sing = intervalToLessonExercise(exercise);
    expect(sing.target.midi).toBe(67);
    expect(exercise.lower.midi).toBe(60);
    expect(exercise.intervalId).toBe("perfect-fifth");
  });

  it.each([
    ["minor-second", 61],
    ["major-third", 64],
    ["tritone", 66],
    ["major-seventh", 71],
  ] as const)("builds diatonic interval %s from root 60", (intervalId, upperMidi) => {
    const interval = getIntervalById(intervalId)!;
    const exercise = buildIntervalExercise(interval, "melodic", 60);
    expect(exercise.intervalId).toBe(intervalId);
    expect(exercise.upper.midi).toBe(upperMidi);
  });
});

describe("randomIntervalExerciseForTag", () => {
  it("generates from an explicit tag id", () => {
    const exercise = randomIntervalExerciseForTag("perfect-fourth", "melodic", {
      lowMidi: 48,
      highMidi: 72,
    });
    expect(exercise.intervalId).toBe("perfect-fourth");
  });
});

describe("randomIntervalExercise", () => {
  it("generates a question for each diatonic id in a tenor range", () => {
    const range = { lowMidi: 48, highMidi: 72 };
    for (const intervalId of DIATONIC_MAJOR_INTERVAL_IDS) {
      const interval = getIntervalById(intervalId)!;
      const exercise = randomIntervalExercise("melodic", range, interval);
      expect(exercise.intervalId).toBe(intervalId);
      expect(exercise.upper.midi - exercise.lower.midi).toBe(interval.semitones);
    }
  });

  it("throws when the interval does not fit the voice range", () => {
    const octave = getIntervalById("perfect-octave")!;
    expect(() => randomIntervalExercise("melodic", { lowMidi: 60, highMidi: 65 }, octave)).toThrow(
      /No valid root/,
    );
  });
});

describe("buildIntervalChoices", () => {
  it("includes the correct interval and excludes duplicates", () => {
    const choices = buildIntervalChoices("perfect-fifth", INTERVAL_2A_IDS);
    const ids = choices.map((c) => c.id);
    expect(ids).toContain("perfect-fifth");
    expect(new Set(ids).size).toBe(ids.length);
    expect(choices.length).toBeGreaterThanOrEqual(2);
  });

  it("draws distractors only from the eligible pool", () => {
    const choices = buildIntervalChoices("minor-second", [
      "minor-second",
      "major-second",
      "minor-third",
    ]);
    const ids = choices.map((c) => c.id);
    for (const id of ids) {
      expect(["minor-second", "major-second", "minor-third"]).toContain(id);
    }
  });
});
