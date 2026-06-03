import { describe, expect, it } from "vitest";
import {
  cMajorTriadAtC3,
  chordFrequenciesHz,
  chordTarget,
  randomMajorTriadWithMiddleInRange,
} from "../src/chords.ts";
import { midiToHz } from "../src/notes.ts";

describe("cMajorTriadAtC3", () => {
  it("builds C3–E3–G3 with middle note as target", () => {
    const question = cMajorTriadAtC3();

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "E3", "G3"]);
    expect(question.targetIndex).toBe(1);
    expect(chordTarget(question).name).toBe("E3");
  });

  it("uses correct frequencies for scoring playback", () => {
    const question = cMajorTriadAtC3();
    const [c, e, g] = chordFrequenciesHz(question);

    expect(c).toBeCloseTo(midiToHz(48), 4);
    expect(e).toBeCloseTo(midiToHz(52), 4);
    expect(g).toBeCloseTo(midiToHz(55), 4);
  });
});

describe("randomMajorTriadWithMiddleInRange", () => {
  it("keeps the middle note within the given range", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    for (let i = 0; i < 50; i++) {
      const question = randomMajorTriadWithMiddleInRange(range);
      const middle = chordTarget(question);
      expect(middle.midi).toBeGreaterThanOrEqual(range.lowMidi);
      expect(middle.midi).toBeLessThanOrEqual(range.highMidi);
    }
  });

  it("builds a major triad with the middle note as target", () => {
    const question = randomMajorTriadWithMiddleInRange({
      lowMidi: 52,
      highMidi: 52,
    });
    const [root, third, fifth] = question.notes;

    expect(third.midi - root.midi).toBe(4);
    expect(fifth.midi - third.midi).toBe(3);
    expect(question.targetIndex).toBe(1);
    expect(chordTarget(question)).toBe(third);
  });
});
