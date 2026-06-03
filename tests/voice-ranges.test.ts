import { describe, expect, it } from "vitest";
import { midiToNoteName } from "../src/notes.ts";
import {
  ACTIVE_VOICE_TYPE,
  getActiveNoteRange,
  VOICE_RANGES,
  type VoiceType,
} from "../src/voice-ranges.ts";

const VOICE_TYPES: VoiceType[] = ["bass", "tenor", "alto", "soprano"];

describe("VOICE_RANGES", () => {
  it.each(VOICE_TYPES)("defines a valid span for %s", (voice) => {
    const { lowMidi, highMidi, label } = VOICE_RANGES[voice];
    expect(lowMidi).toBeLessThan(highMidi);
    expect(highMidi - lowMidi).toBeGreaterThanOrEqual(12);
    expect(label).toContain(midiToNoteName(lowMidi).slice(0, -1));
  });

  it("orders ranges from low to high by voice type", () => {
    expect(VOICE_RANGES.bass.highMidi).toBeLessThan(VOICE_RANGES.tenor.highMidi);
    expect(VOICE_RANGES.tenor.highMidi).toBeLessThan(VOICE_RANGES.alto.highMidi);
    expect(VOICE_RANGES.alto.highMidi).toBeLessThan(VOICE_RANGES.soprano.highMidi);
  });
});

describe("getActiveNoteRange", () => {
  it("returns the active voice range without the label", () => {
    const active = VOICE_RANGES[ACTIVE_VOICE_TYPE];
    expect(getActiveNoteRange()).toEqual({
      lowMidi: active.lowMidi,
      highMidi: active.highMidi,
    });
  });

  it("defaults to tenor", () => {
    expect(ACTIVE_VOICE_TYPE).toBe("tenor");
    expect(getActiveNoteRange()).toEqual({
      lowMidi: 48,
      highMidi: 67,
    });
  });
});
