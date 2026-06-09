import { describe, expect, it } from "vitest"
import {
  cDiminishedTriadAtC3,
  cMajorTriadAtC3,
  cMinorTriadAtC3,
  DIMINISHED_TRIAD,
  enabledChordTypes,
  MAJOR_TRIAD,
  MINOR_TRIAD,
  majorTriadAtVoicingPosition,
  randomDiminishedTriadWithMiddleInRange,
  randomMajorTriadWithMiddleInRange,
  randomMinorTriadWithMiddleInRange,
} from "../src/chord-config.ts"
import { voicingOffsetsForInversion, voicingOffsetsFromAnchor } from "../src/chord-inversions.ts"
import { buildChordExercise, randomChordExercise } from "../src/chord-types.ts"
import { chordFrequenciesHz, chordTarget } from "../src/chords.ts"
import { midiToHz } from "../src/notes.ts"

describe("buildChordExercise", () => {
  it("applies root-position voicing from the middle note (major)", () => {
    const exercise = buildChordExercise(MAJOR_TRIAD, "root", 1, 52)

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "E3", "G3"])
    expect(exercise.targetIndex).toBe(1)
    expect(chordTarget(exercise).name).toBe("E3")
  })

  it("applies root-position voicing from the bottom note (major)", () => {
    const exercise = buildChordExercise(MAJOR_TRIAD, "root", 0, 48)

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "E3", "G3"])
    expect(exercise.targetIndex).toBe(0)
    expect(chordTarget(exercise).name).toBe("C3")
  })

  it("applies root-position voicing from the top note (major)", () => {
    const exercise = buildChordExercise(MAJOR_TRIAD, "root", 2, 55)

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "E3", "G3"])
    expect(exercise.targetIndex).toBe(2)
    expect(chordTarget(exercise).name).toBe("G3")
  })

  it("applies root-position voicing from the middle note (minor)", () => {
    const exercise = buildChordExercise(MINOR_TRIAD, "root", 1, 51)

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "D#3", "G3"])
    expect(exercise.targetIndex).toBe(1)
    expect(chordTarget(exercise).name).toBe("D#3")
  })

  it("applies root-position voicing from the middle note (diminished)", () => {
    const exercise = buildChordExercise(DIMINISHED_TRIAD, "root", 1, 51)

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "D#3", "F#3"])
    expect(exercise.targetIndex).toBe(1)
    expect(chordTarget(exercise).name).toBe("D#3")
  })

  it("voices major 1st inversion with the fifth as the middle note", () => {
    const exercise = majorTriadAtVoicingPosition("first", 1, 55)

    expect(exercise.notes.map((n) => n.name)).toEqual(["E3", "G3", "C4"])
    expect(chordTarget(exercise).name).toBe("G3")
  })

  it("voices major 2nd inversion with the root as the middle note", () => {
    const exercise = majorTriadAtVoicingPosition("second", 1, 60)

    expect(exercise.notes.map((n) => n.name)).toEqual(["G3", "C4", "E4"])
    expect(chordTarget(exercise).name).toBe("C4")
  })
})

describe("voicingOffsetsFromAnchor", () => {
  it("matches legacy root-position middle-anchor offsets for each quality", () => {
    expect(voicingOffsetsFromAnchor([0, 4, 7], "root", 1)).toEqual([-4, 0, 3])
    expect(voicingOffsetsFromAnchor([0, 3, 7], "root", 1)).toEqual([-3, 0, 4])
    expect(voicingOffsetsFromAnchor([0, 3, 6], "root", 1)).toEqual([-3, 0, 3])
  })

  it("matches deprecated voicingOffsetsForInversion helper", () => {
    expect(voicingOffsetsForInversion([0, 4, 7], "root")).toEqual([-4, 0, 3])
  })
})

describe("randomChordExercise", () => {
  it("keeps the range anchor note within the given range (major, middle)", () => {
    const range = { lowMidi: 48, highMidi: 67 }
    for (let i = 0; i < 50; i++) {
      const exercise = randomChordExercise(MAJOR_TRIAD, "root", 1, range)
      const anchor = chordTarget(exercise)
      expect(anchor.midi).toBeGreaterThanOrEqual(range.lowMidi)
      expect(anchor.midi).toBeLessThanOrEqual(range.highMidi)
    }
  })

  it("keeps the range anchor note within the given range (major, bottom)", () => {
    const range = { lowMidi: 48, highMidi: 67 }
    for (let i = 0; i < 50; i++) {
      const exercise = randomChordExercise(MAJOR_TRIAD, "root", 0, range)
      const anchor = chordTarget(exercise)
      expect(anchor.midi).toBeGreaterThanOrEqual(range.lowMidi)
      expect(anchor.midi).toBeLessThanOrEqual(range.highMidi)
    }
  })

  it("keeps the range anchor note within the given range (major, top)", () => {
    const range = { lowMidi: 48, highMidi: 67 }
    for (let i = 0; i < 50; i++) {
      const exercise = randomChordExercise(MAJOR_TRIAD, "root", 2, range)
      const anchor = chordTarget(exercise)
      expect(anchor.midi).toBeGreaterThanOrEqual(range.lowMidi)
      expect(anchor.midi).toBeLessThanOrEqual(range.highMidi)
    }
  })
})

describe("cMajorTriadAtC3", () => {
  it("builds C3–E3–G3 with middle note as target", () => {
    const exercise = cMajorTriadAtC3()

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "E3", "G3"])
    expect(exercise.targetIndex).toBe(1)
    expect(chordTarget(exercise).name).toBe("E3")
  })

  it("uses correct frequencies for scoring playback", () => {
    const exercise = cMajorTriadAtC3()
    const [c, e, g] = chordFrequenciesHz(exercise)

    expect(c).toBeCloseTo(midiToHz(48), 4)
    expect(e).toBeCloseTo(midiToHz(52), 4)
    expect(g).toBeCloseTo(midiToHz(55), 4)
  })
})

describe("cMinorTriadAtC3", () => {
  it("builds C3–Eb3–G3 with middle note as target", () => {
    const exercise = cMinorTriadAtC3()

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "D#3", "G3"])
    expect(chordTarget(exercise).name).toBe("D#3")
  })
})

describe("cDiminishedTriadAtC3", () => {
  it("builds C3–Eb3–Gb3 with middle note as target", () => {
    const exercise = cDiminishedTriadAtC3()

    expect(exercise.notes.map((n) => n.name)).toEqual(["C3", "D#3", "F#3"])
    expect(chordTarget(exercise).name).toBe("D#3")
  })
})

describe("randomMajorTriadWithMiddleInRange", () => {
  it("keeps the middle note within the given range", () => {
    const range = { lowMidi: 48, highMidi: 67 }
    for (let i = 0; i < 50; i++) {
      const exercise = randomMajorTriadWithMiddleInRange(range)
      const middle = chordTarget(exercise)
      expect(middle.midi).toBeGreaterThanOrEqual(range.lowMidi)
      expect(middle.midi).toBeLessThanOrEqual(range.highMidi)
    }
  })

  it("builds a major triad with the middle note as target", () => {
    const exercise = randomMajorTriadWithMiddleInRange({
      lowMidi: 52,
      highMidi: 52,
    })
    const [root, third, fifth] = exercise.notes

    expect(third.midi - root.midi).toBe(4)
    expect(fifth.midi - third.midi).toBe(3)
    expect(exercise.targetIndex).toBe(1)
    expect(chordTarget(exercise)).toBe(third)
  })
})

describe("randomMinorTriadWithMiddleInRange", () => {
  it("builds a minor triad with the middle note as target", () => {
    const exercise = randomMinorTriadWithMiddleInRange({
      lowMidi: 51,
      highMidi: 51,
    })
    const [root, third, fifth] = exercise.notes

    expect(third.midi - root.midi).toBe(3)
    expect(fifth.midi - third.midi).toBe(4)
    expect(chordTarget(exercise)).toBe(third)
  })
})

describe("randomDiminishedTriadWithMiddleInRange", () => {
  it("builds a diminished triad with the middle note as target", () => {
    const exercise = randomDiminishedTriadWithMiddleInRange({
      lowMidi: 51,
      highMidi: 51,
    })
    const [root, third, fifth] = exercise.notes

    expect(third.midi - root.midi).toBe(3)
    expect(fifth.midi - third.midi).toBe(3)
    expect(chordTarget(exercise)).toBe(third)
  })
})

describe("chord config", () => {
  it("includes major and minor triads when enabled", () => {
    const ids = enabledChordTypes().map((t) => t.id)
    expect(ids).toContain("major-triad")
    expect(ids).toContain("minor-triad")
    expect(ids).not.toContain("diminished-triad")
  })
})
