import { describe, expect, it } from "vitest";
import { getScaleDegreeById, SCALE_DEGREES } from "../src/scale-degree-config.ts";
import { resetScaleDegreePreference } from "../src/scale-degree-preference.ts";
import {
  buildScaleDegreeQuestion,
  maxSemitonesAmong,
  randomScaleDegreeQuestion,
  randomScaleDegreeQuestionForTonic,
  scaleDegreeToSingTestQuestion,
  validRoundTonicMidis,
  validTonicMidis,
} from "../src/scale-degree-questions.ts";

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

describe("buildScaleDegreeQuestion", () => {
  it("sets target as tonic plus semitones", () => {
    const fifth = getScaleDegreeById("fifth")!;
    const question = buildScaleDegreeQuestion(fifth, 60);
    const sing = scaleDegreeToSingTestQuestion(question);
    expect(question.tonic.midi).toBe(60);
    expect(sing.target.midi).toBe(67);
    expect(question.degreeId).toBe("fifth");
    expect(sing.degreeId).toBe("fifth");
    expect(sing.scaleDegree?.tonic.midi).toBe(60);
  });
});

describe("randomScaleDegreeQuestion", () => {
  it("throws when no tonic fits the range", () => {
    resetScaleDegreePreference();
    const octave = getScaleDegreeById("octave")!;
    expect(() =>
      randomScaleDegreeQuestion({ lowMidi: 60, highMidi: 65 }, octave),
    ).toThrow(/No valid tonic/);
  });
});

describe("round tonic", () => {
  const tenorRange = { lowMidi: 48, highMidi: 67 } as const;

  it("uses max span among active degrees for valid round tonics", () => {
    resetScaleDegreePreference();
    const roundTonics = validRoundTonicMidis(tenorRange, SCALE_DEGREES);
    const fourthOnly = validTonicMidis(tenorRange, 5);
    expect(roundTonics.length).toBeLessThan(fourthOnly.length);
    expect(maxSemitonesAmong(SCALE_DEGREES)).toBe(12);
    expect(Math.max(...roundTonics) + 12).toBeLessThanOrEqual(67);
  });

  it("keeps the same tonic across questions in a round", () => {
    const fourth = getScaleDegreeById("fourth")!;
    const fifth = getScaleDegreeById("fifth")!;
    const tonicMidi = 60;
    const q4 = randomScaleDegreeQuestionForTonic(tonicMidi, fourth);
    const q5 = randomScaleDegreeQuestionForTonic(tonicMidi, fifth);
    expect(q4.tonic.midi).toBe(tonicMidi);
    expect(q5.tonic.midi).toBe(tonicMidi);
    expect(q4.target.midi).not.toBe(q5.target.midi);
  });
});
