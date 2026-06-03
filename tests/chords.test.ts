import { describe, expect, it } from "vitest";
import {
  MAJOR_TRIAD_SING_MIDDLE,
  MINOR_TRIAD_SING_MIDDLE,
  cMajorTriadAtC3,
  cMinorTriadAtC3,
  enabledChordTypes,
  pickRandomChordType,
  randomEnabledChordQuestion,
  randomMajorTriadWithMiddleInRange,
  randomMinorTriadWithMiddleInRange,
} from "../src/chord-config.ts";
import {
  buildChordQuestion,
  randomChordQuestion,
} from "../src/chord-types.ts";
import { chordFrequenciesHz, chordTarget } from "../src/chords.ts";
import { midiToHz } from "../src/notes.ts";

describe("buildChordQuestion", () => {
  it("applies voicing offsets from the anchor note (major)", () => {
    const question = buildChordQuestion(MAJOR_TRIAD_SING_MIDDLE, 52);

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "E3", "G3"]);
    expect(question.targetIndex).toBe(1);
    expect(chordTarget(question).name).toBe("E3");
  });

  it("applies voicing offsets from the anchor note (minor)", () => {
    const question = buildChordQuestion(MINOR_TRIAD_SING_MIDDLE, 51);

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "D#3", "G3"]);
    expect(question.targetIndex).toBe(1);
    expect(chordTarget(question).name).toBe("D#3");
  });
});

describe("randomChordQuestion", () => {
  it("keeps the range anchor note within the given range (major)", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    for (let i = 0; i < 50; i++) {
      const question = randomChordQuestion(MAJOR_TRIAD_SING_MIDDLE, range);
      const anchor = question.notes[MAJOR_TRIAD_SING_MIDDLE.rangeAnchorIndex]!;
      expect(anchor.midi).toBeGreaterThanOrEqual(range.lowMidi);
      expect(anchor.midi).toBeLessThanOrEqual(range.highMidi);
    }
  });

  it("keeps the range anchor note within the given range (minor)", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    for (let i = 0; i < 50; i++) {
      const question = randomChordQuestion(MINOR_TRIAD_SING_MIDDLE, range);
      const anchor = question.notes[MINOR_TRIAD_SING_MIDDLE.rangeAnchorIndex]!;
      expect(anchor.midi).toBeGreaterThanOrEqual(range.lowMidi);
      expect(anchor.midi).toBeLessThanOrEqual(range.highMidi);
    }
  });
});

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

describe("cMinorTriadAtC3", () => {
  it("builds C3–Eb3–G3 with middle note as target", () => {
    const question = cMinorTriadAtC3();

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "D#3", "G3"]);
    expect(chordTarget(question).name).toBe("D#3");
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

describe("randomMinorTriadWithMiddleInRange", () => {
  it("builds a minor triad with the middle note as target", () => {
    const question = randomMinorTriadWithMiddleInRange({
      lowMidi: 51,
      highMidi: 51,
    });
    const [root, third, fifth] = question.notes;

    expect(third.midi - root.midi).toBe(3);
    expect(fifth.midi - third.midi).toBe(4);
    expect(chordTarget(question)).toBe(third);
  });
});

describe("chord config", () => {
  it("includes major and minor triads when enabled", () => {
    const ids = enabledChordTypes().map((t) => t.id);
    expect(ids).toContain("major-triad-sing-middle");
    expect(ids).toContain("minor-triad-sing-middle");
  });

  it("randomEnabledChordQuestion uses only enabled types", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    const enabledIds = new Set(enabledChordTypes().map((t) => t.id));
    for (let i = 0; i < 80; i++) {
      expect(enabledIds).toContain(pickRandomChordType().id);
      randomEnabledChordQuestion(range);
    }
  });
});
