import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTE_RANGE,
  midiToHz,
  midiToNoteName,
  randomNoteInRange,
} from "../src/notes.ts";

describe("midiToHz", () => {
  it("maps C4 to standard tuning", () => {
    expect(midiToHz(60)).toBeCloseTo(261.63, 1);
  });

  it("maps C3 below C4", () => {
    expect(midiToHz(48)).toBeCloseTo(130.81, 1);
  });
});

describe("midiToNoteName", () => {
  it("formats chromatic names with octave", () => {
    expect(midiToNoteName(48)).toBe("C3");
    expect(midiToNoteName(60)).toBe("C4");
    expect(midiToNoteName(61)).toBe("C#4");
  });
});

describe("randomNoteInRange", () => {
  it("stays within default C3–C4 range", () => {
    for (let i = 0; i < 50; i++) {
      const note = randomNoteInRange();
      expect(note.midi).toBeGreaterThanOrEqual(DEFAULT_NOTE_RANGE.lowMidi);
      expect(note.midi).toBeLessThanOrEqual(DEFAULT_NOTE_RANGE.highMidi);
      expect(note.hz).toBeCloseTo(midiToHz(note.midi), 5);
      expect(note.name).toBe(midiToNoteName(note.midi));
    }
  });
});
