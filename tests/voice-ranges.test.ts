import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { midiToNoteName } from "../src/notes.ts"
import {
  DEFAULT_VOICE_TYPE,
  getActiveNoteRange,
  getNoteRangeForVoice,
  getVoiceType,
  resetVoiceTypePreference,
  setVoiceType,
  VOICE_RANGES,
  VOICE_TYPES,
  type VoiceType,
} from "../src/voice-ranges.ts"

describe("VOICE_RANGES", () => {
  it.each(VOICE_TYPES)("defines a valid span for %s", (voice) => {
    const { lowMidi, highMidi, label } = VOICE_RANGES[voice]
    expect(lowMidi).toBeLessThan(highMidi)
    expect(highMidi - lowMidi).toBeGreaterThanOrEqual(12)
    expect(label).toContain(midiToNoteName(lowMidi).slice(0, -1))
  })

  it("orders ranges from low to high by voice type", () => {
    expect(VOICE_RANGES.bass.highMidi).toBeLessThan(VOICE_RANGES.tenor.highMidi)
    expect(VOICE_RANGES.tenor.highMidi).toBeLessThan(VOICE_RANGES.alto.highMidi)
    expect(VOICE_RANGES.alto.highMidi).toBeLessThan(VOICE_RANGES.soprano.highMidi)
  })
})

describe("voice type preference", () => {
  beforeEach(() => {
    resetVoiceTypePreference()
  })

  afterEach(() => {
    resetVoiceTypePreference()
  })

  it("defaults to tenor when nothing is stored", () => {
    expect(getVoiceType()).toBe(DEFAULT_VOICE_TYPE)
    expect(getActiveNoteRange()).toEqual(getNoteRangeForVoice("tenor"))
  })

  it("persists the selected voice type", () => {
    setVoiceType("alto")
    expect(getVoiceType()).toBe("alto")
    expect(getActiveNoteRange()).toEqual({
      lowMidi: VOICE_RANGES.alto.lowMidi,
      highMidi: VOICE_RANGES.alto.highMidi,
    })
  })

  it.each(
    VOICE_TYPES as VoiceType[],
  )("getNoteRangeForVoice returns midi bounds without label for %s", (voice) => {
    expect(getNoteRangeForVoice(voice)).toEqual({
      lowMidi: VOICE_RANGES[voice].lowMidi,
      highMidi: VOICE_RANGES[voice].highMidi,
    })
  })
})
