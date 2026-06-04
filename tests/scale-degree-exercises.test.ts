import { describe, expect, it } from "vitest";
import { getScaleDegreeById, SCALE_DEGREES } from "../src/scale-degree-config.ts";
import {
  buildScaleDegreeExercise,
  maxSemitonesAmong,
  randomScaleDegreeExercise,
  randomScaleDegreeExerciseForTonic,
  scaleDegreeToLessonExercise,
  validLessonTonicMidis,
  validTonicMidis,
} from "../src/scale-degree-exercises.ts";

describe("validTonicMidis", () => {
  it("fits fifth degree within a tenor-like range", () => {
    const tonics = validTonicMidis({ lowMidi: 48, highMidi: 67 }, 7);
    expect(tonics.length).toBeGreaterThan(0);
    expect(Math.max(...tonics) + 7).toBeLessThanOrEqual(67);
  });

  it("returns empty when octave does not fit", () => {
    const tonics = validTonicMidis({ lowMidi: 60, highMidi: 65 }, 12);
    expect(tonics).toEqual([]);
  });
});

describe("buildScaleDegreeExercise", () => {
  it("sets target as tonic plus semitones", () => {
    const fifth = getScaleDegreeById("fifth")!;
    const exercise = buildScaleDegreeExercise(fifth, 60);
    const sing = scaleDegreeToLessonExercise(exercise);
    expect(exercise.tonic.midi).toBe(60);
    expect(sing.target.midi).toBe(67);
    expect(exercise.degreeId).toBe("fifth");
    expect(sing.degreeId).toBe("fifth");
    expect(sing.scaleDegree?.tonic.midi).toBe(60);
  });
});

describe("randomScaleDegreeExercise", () => {
  it("throws when no tonic fits the range", () => {
    const octave = getScaleDegreeById("octave")!;
    expect(() =>
      randomScaleDegreeExercise({ lowMidi: 60, highMidi: 65 }, octave),
    ).toThrow(/No valid tonic/);
  });
});

describe("lesson tonic", () => {
  const tenorRange = { lowMidi: 48, highMidi: 67 } as const;
  const enabledDegrees = SCALE_DEGREES.filter((entry) => entry.enabled);

  it("uses max span among tier degrees for valid round tonics", () => {
    const lessonTonics = validLessonTonicMidis(tenorRange, enabledDegrees);
    const fourthOnly = validTonicMidis(tenorRange, 5);
    expect(lessonTonics.length).toBeLessThan(fourthOnly.length);
    expect(maxSemitonesAmong(SCALE_DEGREES)).toBe(12);
    expect(Math.max(...lessonTonics) + 12).toBeLessThanOrEqual(67);
  });

  it("keeps the same tonic across exercises in a lesson", () => {
    const fourth = getScaleDegreeById("fourth")!;
    const fifth = getScaleDegreeById("fifth")!;
    const tonicMidi = 60;
    const q4 = randomScaleDegreeExerciseForTonic(tonicMidi, fourth);
    const q5 = randomScaleDegreeExerciseForTonic(tonicMidi, fifth);
    expect(q4.tonic.midi).toBe(tonicMidi);
    expect(q5.tonic.midi).toBe(tonicMidi);
    expect(q4.target.midi).not.toBe(q5.target.midi);
  });
});
