import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DIMINISHED_TRIAD_SING_MIDDLE,
  MAJOR_TRIAD_SING_MIDDLE,
  MINOR_TRIAD_SING_MIDDLE,
  cDiminishedTriadAtC3,
  cMajorTriadAtC3,
  cMinorTriadAtC3,
  enabledChordTypes,
  majorTriadAtMiddle,
  randomMajorTriadWithMiddleInRange,
  randomMinorTriadWithMiddleInRange,
  randomDiminishedTriadWithMiddleInRange,
} from "../src/chord-config.ts";
import {
  getActiveInversions,
  pickRandomInversion,
  resetInversionPreference,
  setInversionSelected,
} from "../src/chord-inversion-preference.ts";
import { voicingOffsetsForInversion } from "../src/chord-inversions.ts";
import {
  getActiveChordTypes,
  pickRandomChordType,
  randomEnabledChordQuestion,
  resetChordTypePreference,
  setChordTypeSelected,
} from "../src/chord-type-preference.ts";
import {
  buildChordQuestion,
  randomChordQuestion,
} from "../src/chord-types.ts";
import { chordFrequenciesHz, chordTarget } from "../src/chords.ts";
import { midiToHz } from "../src/notes.ts";

describe("buildChordQuestion", () => {
  it("applies root-position voicing from the middle note (major)", () => {
    const question = buildChordQuestion(MAJOR_TRIAD_SING_MIDDLE, "root", 52);

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "E3", "G3"]);
    expect(question.targetIndex).toBe(1);
    expect(chordTarget(question).name).toBe("E3");
  });

  it("applies root-position voicing from the middle note (minor)", () => {
    const question = buildChordQuestion(MINOR_TRIAD_SING_MIDDLE, "root", 51);

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "D#3", "G3"]);
    expect(question.targetIndex).toBe(1);
    expect(chordTarget(question).name).toBe("D#3");
  });

  it("applies root-position voicing from the middle note (diminished)", () => {
    const question = buildChordQuestion(
      DIMINISHED_TRIAD_SING_MIDDLE,
      "root",
      51,
    );

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "D#3", "F#3"]);
    expect(question.targetIndex).toBe(1);
    expect(chordTarget(question).name).toBe("D#3");
  });

  it("voices major 1st inversion with the fifth as the middle note", () => {
    const question = majorTriadAtMiddle("first", 55);

    expect(question.notes.map((n) => n.name)).toEqual(["E3", "G3", "C4"]);
    expect(chordTarget(question).name).toBe("G3");
  });

  it("voices major 2nd inversion with the root as the middle note", () => {
    const question = majorTriadAtMiddle("second", 60);

    expect(question.notes.map((n) => n.name)).toEqual(["G3", "C4", "E4"]);
    expect(chordTarget(question).name).toBe("C4");
  });
});

describe("voicingOffsetsForInversion", () => {
  it("matches legacy root-position offsets for each quality", () => {
    expect(voicingOffsetsForInversion([0, 4, 7], "root")).toEqual([-4, 0, 3]);
    expect(voicingOffsetsForInversion([0, 3, 7], "root")).toEqual([-3, 0, 4]);
    expect(voicingOffsetsForInversion([0, 3, 6], "root")).toEqual([-3, 0, 3]);
  });
});

describe("randomChordQuestion", () => {
  it("keeps the range anchor note within the given range (major)", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    for (let i = 0; i < 50; i++) {
      const question = randomChordQuestion(
        MAJOR_TRIAD_SING_MIDDLE,
        "root",
        range,
      );
      const anchor = question.notes[MAJOR_TRIAD_SING_MIDDLE.rangeAnchorIndex]!;
      expect(anchor.midi).toBeGreaterThanOrEqual(range.lowMidi);
      expect(anchor.midi).toBeLessThanOrEqual(range.highMidi);
    }
  });

  it("keeps the range anchor note within the given range (minor)", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    for (let i = 0; i < 50; i++) {
      const question = randomChordQuestion(MINOR_TRIAD_SING_MIDDLE, "root", range);
      const anchor = question.notes[MINOR_TRIAD_SING_MIDDLE.rangeAnchorIndex]!;
      expect(anchor.midi).toBeGreaterThanOrEqual(range.lowMidi);
      expect(anchor.midi).toBeLessThanOrEqual(range.highMidi);
    }
  });

  it("keeps the range anchor note within the given range (diminished)", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    for (let i = 0; i < 50; i++) {
      const question = randomChordQuestion(
        DIMINISHED_TRIAD_SING_MIDDLE,
        "root",
        range,
      );
      const anchor =
        question.notes[DIMINISHED_TRIAD_SING_MIDDLE.rangeAnchorIndex]!;
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

describe("cDiminishedTriadAtC3", () => {
  it("builds C3–Eb3–Gb3 with middle note as target", () => {
    const question = cDiminishedTriadAtC3();

    expect(question.notes.map((n) => n.name)).toEqual(["C3", "D#3", "F#3"]);
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

describe("randomDiminishedTriadWithMiddleInRange", () => {
  it("builds a diminished triad with the middle note as target", () => {
    const question = randomDiminishedTriadWithMiddleInRange({
      lowMidi: 51,
      highMidi: 51,
    });
    const [root, third, fifth] = question.notes;

    expect(third.midi - root.midi).toBe(3);
    expect(fifth.midi - third.midi).toBe(3);
    expect(chordTarget(question)).toBe(third);
  });
});

describe("chord config", () => {
  beforeEach(() => {
    resetChordTypePreference();
    resetInversionPreference();
  });

  afterEach(() => {
    resetChordTypePreference();
    resetInversionPreference();
  });

  it("includes major, minor, and diminished triads when enabled", () => {
    const ids = enabledChordTypes().map((t) => t.id);
    expect(ids).toContain("major-triad-sing-middle");
    expect(ids).toContain("minor-triad-sing-middle");
    expect(ids).toContain("diminished-triad-sing-middle");
  });

  it("randomEnabledChordQuestion uses only selected types", () => {
    const range = { lowMidi: 48, highMidi: 67 };
    const activeIds = new Set(getActiveChordTypes().map((t) => t.id));
    for (let i = 0; i < 80; i++) {
      expect(activeIds).toContain(pickRandomChordType().id);
      randomEnabledChordQuestion(range);
    }
  });

  it("respects user chord type selection", () => {
    setChordTypeSelected("major-triad-sing-middle", false);
    setChordTypeSelected("minor-triad-sing-middle", false);

    const activeIds = getActiveChordTypes().map((t) => t.id);
    expect(activeIds).toEqual(["diminished-triad-sing-middle"]);

    for (let i = 0; i < 30; i++) {
      expect(pickRandomChordType().id).toBe("diminished-triad-sing-middle");
    }
  });

  it("respects user inversion selection", () => {
    setInversionSelected("root", false);
    setInversionSelected("second", false);

    const activeIds = getActiveInversions().map((inv) => inv.id);
    expect(activeIds).toEqual(["first"]);

    for (let i = 0; i < 30; i++) {
      expect(pickRandomInversion()).toBe("first");
    }
  });
});
