import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isUnlockAllEnabled } from "../src/curriculum/dev-unlock.ts"
import {
  getContinueCurriculumLesson,
  getContinuePracticeMode,
  getUnlockRequirement,
  isCurriculumLessonUnlocked,
  isLevelUnlocked,
  isPracticeModeUnlocked,
  MIN_EXERCISE_PASS_RATE,
  MIN_EXERCISES_FOR_UNLOCK,
} from "../src/curriculum/unlock.ts"
import {
  passingChordMajorSecondHistory,
  passingFullGuidedPathHistory,
  passingIntroScaleDegreeHistory,
  passingLevel2History,
  passingMajorDiatonicScaleDegreeHistory,
  passingMelodicSing2bHistory,
  passingSingleNoteHistory,
  passingStepHistory,
  passingThroughHarmonic2bHistory,
  passingThroughHarmonicId2aHistory,
  passingThroughHarmonicSing2aHistory,
  passingThroughMelodic2bHistory,
} from "./fixtures/attempts.ts"

describe("isPracticeModeUnlocked", () => {
  it("always unlocks the first path exercise", () => {
    expect(isPracticeModeUnlocked("single-note", [])).toBe(true)
  })

  it("locks chord-sing until interval 2a harmonic sing passes", () => {
    expect(isPracticeModeUnlocked("chord-sing", [])).toBe(false)
    expect(isPracticeModeUnlocked("chord-sing", passingSingleNoteHistory())).toBe(false)
    expect(isPracticeModeUnlocked("chord-sing", passingThroughHarmonicSing2aHistory())).toBe(true)
    expect(isPracticeModeUnlocked("chord-sing", passingThroughHarmonic2bHistory())).toBe(true)
  })

  it("locks path successors until the predecessor meets thresholds", () => {
    const records = passingSingleNoteHistory().slice(0, MIN_EXERCISES_FOR_UNLOCK - 1)
    expect(isPracticeModeUnlocked("interval-melodic-sing", records)).toBe(false)
  })

  it("unlocks the next path exercise when the predecessor passes", () => {
    const records = passingSingleNoteHistory()
    expect(isPracticeModeUnlocked("interval-melodic-sing", records)).toBe(true)
  })

  it("locks scale-degree-sing until harmonic identify at 2a passes", () => {
    expect(isPracticeModeUnlocked("scale-degree-sing", passingSingleNoteHistory())).toBe(false)
    expect(isPracticeModeUnlocked("scale-degree-sing", passingLevel2History())).toBe(true)
    expect(isPracticeModeUnlocked("scale-degree-sing", passingThroughMelodic2bHistory())).toBe(true)
  })

  describe("?unlock=all", () => {
    beforeEach(() => {
      vi.stubGlobal("location", { search: "?unlock=all" })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it("isUnlockAllEnabled reads the query param", () => {
      expect(isUnlockAllEnabled()).toBe(true)
      expect(isUnlockAllEnabled("")).toBe(false)
    })

    it("unlocks path exercises with empty history", () => {
      expect(isPracticeModeUnlocked("scale-degree-sing", [])).toBe(true)
      expect(isPracticeModeUnlocked("interval-melodic-sing", [])).toBe(true)
    })

    it("does not change getContinuePracticeMode progress", () => {
      expect(getContinuePracticeMode([])).toBe("single-note")
    })
  })
})

describe("isLevelUnlocked", () => {
  it("unlocks level 1 with no history", () => {
    expect(isLevelUnlocked(1, [])).toBe(true)
  })

  it("locks level 2 until single-note meets thresholds", () => {
    expect(isLevelUnlocked(2, [])).toBe(false)
    expect(isLevelUnlocked(2, passingSingleNoteHistory())).toBe(true)
  })

  it("locks level 3 until harmonic identify at 2a passes", () => {
    expect(isLevelUnlocked(3, passingSingleNoteHistory())).toBe(false)
    expect(isLevelUnlocked(3, passingLevel2History())).toBe(true)
  })
})

describe("isCurriculumLessonUnlocked", () => {
  it("locks named-interval sing at 2a until melodic sing at 2a passes", () => {
    const named2a = {
      practiceModeId: "interval-named-sing" as const,
      contentTierId: "interval-2a" as const,
    }
    expect(isCurriculumLessonUnlocked(named2a, passingSingleNoteHistory())).toBe(false)
    expect(
      isCurriculumLessonUnlocked(named2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          practiceModeId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(true)
  })

  it("locks melodic identify at 2a until named-interval sing at 2a passes", () => {
    const id2a = {
      practiceModeId: "interval-melodic-id" as const,
      contentTierId: "interval-2a" as const,
    }
    expect(isCurriculumLessonUnlocked(id2a, passingSingleNoteHistory())).toBe(false)
    expect(
      isCurriculumLessonUnlocked(id2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          practiceModeId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(false)
    expect(
      isCurriculumLessonUnlocked(id2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          practiceModeId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
        ...passingStepHistory({
          practiceModeId: "interval-named-sing",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(true)
  })

  it("locks harmonic sing at 2a until melodic identify at 2a passes", () => {
    const sing2a = {
      practiceModeId: "interval-harmonic-sing" as const,
      contentTierId: "interval-2a" as const,
    }
    expect(isCurriculumLessonUnlocked(sing2a, passingSingleNoteHistory())).toBe(false)
    expect(
      isCurriculumLessonUnlocked(sing2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          practiceModeId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
        ...passingStepHistory({
          practiceModeId: "interval-named-sing",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(false)
    expect(
      isCurriculumLessonUnlocked(sing2a, [
        ...passingSingleNoteHistory(),
        ...passingStepHistory({
          practiceModeId: "interval-melodic-sing",
          contentTierId: "interval-2a",
        }),
        ...passingStepHistory({
          practiceModeId: "interval-named-sing",
          contentTierId: "interval-2a",
        }),
        ...passingStepHistory({
          practiceModeId: "interval-melodic-id",
          contentTierId: "interval-2a",
        }),
      ]),
    ).toBe(true)
  })

  it("locks melodic 2b until intro scale degrees pass", () => {
    const sing2b = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2b" as const,
    }
    expect(isCurriculumLessonUnlocked(sing2b, passingSingleNoteHistory())).toBe(false)
    expect(isCurriculumLessonUnlocked(sing2b, passingLevel2History())).toBe(false)
    expect(isCurriculumLessonUnlocked(sing2b, passingIntroScaleDegreeHistory())).toBe(true)
  })

  it("locks melodic identify at 2b until chord minor first passes", () => {
    const id2b = {
      practiceModeId: "interval-melodic-id" as const,
      contentTierId: "interval-2b" as const,
    }
    expect(isCurriculumLessonUnlocked(id2b, passingLevel2History())).toBe(false)
    expect(isCurriculumLessonUnlocked(id2b, passingMelodicSing2bHistory())).toBe(false)
    expect(
      isCurriculumLessonUnlocked(id2b, [
        ...passingMelodicSing2bHistory(),
        ...passingStepHistory({
          practiceModeId: "chord-sing",
          contentTierId: "chord-major-first",
        }),
        ...passingStepHistory({
          practiceModeId: "interval-named-sing",
          contentTierId: "interval-2b",
        }),
      ]),
    ).toBe(false)
    expect(
      isCurriculumLessonUnlocked(id2b, [
        ...passingMelodicSing2bHistory(),
        ...passingStepHistory({
          practiceModeId: "chord-sing",
          contentTierId: "chord-major-first",
        }),
        ...passingStepHistory({
          practiceModeId: "interval-named-sing",
          contentTierId: "interval-2b",
        }),
        ...passingStepHistory({
          practiceModeId: "chord-sing",
          contentTierId: "chord-minor-first",
        }),
      ]),
    ).toBe(true)
  })

  it("locks harmonic sing at 2b until melodic identify at 2b passes", () => {
    const sing2b = {
      practiceModeId: "interval-harmonic-sing" as const,
      contentTierId: "interval-2b" as const,
    }
    expect(isCurriculumLessonUnlocked(sing2b, passingMelodicSing2bHistory())).toBe(false)
    expect(isCurriculumLessonUnlocked(sing2b, passingThroughMelodic2bHistory())).toBe(true)
  })

  it("locks harmonic identify at 2b until harmonic sing at 2b passes", () => {
    const id2b = {
      practiceModeId: "interval-harmonic-id" as const,
      contentTierId: "interval-2b" as const,
    }
    expect(isCurriculumLessonUnlocked(id2b, passingThroughMelodic2bHistory())).toBe(false)
    expect(
      isCurriculumLessonUnlocked(id2b, [
        ...passingThroughMelodic2bHistory(),
        ...passingStepHistory({
          practiceModeId: "interval-harmonic-sing",
          contentTierId: "interval-2b",
        }),
      ]),
    ).toBe(true)
  })
})

describe("getContinueCurriculumLesson", () => {
  it("points at the first path exercise on a fresh profile", () => {
    expect(getContinueCurriculumLesson([])).toEqual({
      practiceModeId: "single-note",
      contentTierId: "tier-1",
    })
  })

  it("advances to intro scale degrees after interval 2a completes", () => {
    expect(getContinuePracticeMode(passingLevel2History())).toBe("scale-degree-sing")
    expect(getContinueCurriculumLesson(passingLevel2History())).toEqual({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    })
  })

  it("advances to melodic sing at 2b after intro scale degrees complete", () => {
    expect(getContinuePracticeMode(passingIntroScaleDegreeHistory())).toBe("interval-melodic-sing")
    expect(getContinueCurriculumLesson(passingIntroScaleDegreeHistory())).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    })
  })

  it("advances to chord major first after melodic sing 2b completes", () => {
    expect(getContinuePracticeMode(passingMelodicSing2bHistory())).toBe("chord-sing")
    expect(getContinueCurriculumLesson(passingMelodicSing2bHistory())).toEqual({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-first",
    })
  })

  it("advances to harmonic sing at 2b after melodic identification 2b completes", () => {
    expect(getContinuePracticeMode(passingThroughMelodic2bHistory())).toBe("interval-harmonic-sing")
    expect(getContinueCurriculumLesson(passingThroughMelodic2bHistory())).toEqual({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    })
  })

  it("advances to major diatonic scale degrees after interval 2b completes", () => {
    expect(getContinuePracticeMode(passingThroughHarmonic2bHistory())).toBe("scale-degree-sing")
    expect(getContinueCurriculumLesson(passingThroughHarmonic2bHistory())).toEqual({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-diatonic",
    })
  })

  it("advances to chord major second after major diatonic scale degrees complete", () => {
    expect(getContinuePracticeMode(passingMajorDiatonicScaleDegreeHistory())).toBe("chord-sing")
    expect(getContinueCurriculumLesson(passingMajorDiatonicScaleDegreeHistory())).toEqual({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-second",
    })
  })

  it("advances to minor diatonic scale degrees after chord major second completes", () => {
    expect(getContinuePracticeMode(passingChordMajorSecondHistory())).toBe("scale-degree-sing")
    expect(getContinueCurriculumLesson(passingChordMajorSecondHistory())).toEqual({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-minor-diatonic",
    })
  })

  it("advances to chord major root after interval 2a harmonic sing completes", () => {
    expect(getContinuePracticeMode(passingThroughHarmonicSing2aHistory())).toBe("chord-sing")
    expect(getContinueCurriculumLesson(passingThroughHarmonicSing2aHistory())).toEqual({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-root",
    })
  })

  it("advances to chord minor root after interval 2a harmonic identification completes", () => {
    expect(getContinuePracticeMode(passingThroughHarmonicId2aHistory())).toBe("chord-sing")
    expect(getContinueCurriculumLesson(passingThroughHarmonicId2aHistory())).toEqual({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-root",
    })
  })
})

describe("getContinuePracticeMode", () => {
  it("points at the first path exercise on a fresh profile", () => {
    expect(getContinuePracticeMode([])).toBe("single-note")
  })

  it("advances after the current exercise meets thresholds", () => {
    expect(getContinuePracticeMode(passingSingleNoteHistory())).toBe("interval-melodic-sing")
  })

  it("returns null when every curriculum step meets thresholds", () => {
    expect(getContinuePracticeMode(passingFullGuidedPathHistory())).toBe(null)
  })
})

describe("getUnlockRequirement", () => {
  it("returns null for the first path exercise", () => {
    expect(getUnlockRequirement("single-note")).toBe(null)
  })

  it("describes the predecessor and thresholds for later path exercises", () => {
    expect(getUnlockRequirement("interval-melodic-sing")).toEqual({
      predecessorPracticeModeId: "single-note",
      predecessorLabel: "Sing a single note",
      minExercisesForUnlock: MIN_EXERCISES_FOR_UNLOCK,
      minPassRatePercent: MIN_EXERCISE_PASS_RATE,
    })
  })

  it("includes tier pool in predecessor label for scale-degree sing", () => {
    expect(getUnlockRequirement("scale-degree-sing")).toEqual({
      predecessorPracticeModeId: "chord-sing",
      predecessorLabel: "Sing chord voices (Minor triad · root position)",
      minExercisesForUnlock: MIN_EXERCISES_FOR_UNLOCK,
      minPassRatePercent: MIN_EXERCISE_PASS_RATE,
    })
  })

  it("locks major diatonic scale degrees until harmonic identify at 2b passes", () => {
    const majorDiatonic = {
      practiceModeId: "scale-degree-sing" as const,
      contentTierId: "degree-major-diatonic" as const,
    }
    expect(isCurriculumLessonUnlocked(majorDiatonic, passingThroughMelodic2bHistory())).toBe(false)
    expect(isCurriculumLessonUnlocked(majorDiatonic, passingThroughHarmonic2bHistory())).toBe(true)
  })

  it("requires harmonic sing at 2a before chord major root", () => {
    const chordMajorRoot = {
      practiceModeId: "chord-sing" as const,
      contentTierId: "chord-major-root" as const,
    }
    expect(isCurriculumLessonUnlocked(chordMajorRoot, passingSingleNoteHistory())).toBe(false)
    expect(isCurriculumLessonUnlocked(chordMajorRoot, passingThroughHarmonicSing2aHistory())).toBe(
      true,
    )
  })

  it("requires harmonic identify at 2a before chord minor root", () => {
    const chordMinorRoot = {
      practiceModeId: "chord-sing" as const,
      contentTierId: "chord-minor-root" as const,
    }
    expect(isCurriculumLessonUnlocked(chordMinorRoot, passingThroughHarmonicSing2aHistory())).toBe(
      false,
    )
    expect(isCurriculumLessonUnlocked(chordMinorRoot, passingThroughHarmonicId2aHistory())).toBe(
      true,
    )
  })

  it("requires melodic sing at 2b before chord major first", () => {
    const chordMajorFirst = {
      practiceModeId: "chord-sing" as const,
      contentTierId: "chord-major-first" as const,
    }
    expect(isCurriculumLessonUnlocked(chordMajorFirst, passingIntroScaleDegreeHistory())).toBe(
      false,
    )
    expect(isCurriculumLessonUnlocked(chordMajorFirst, passingMelodicSing2bHistory())).toBe(true)
  })

  it("requires major diatonic scale degrees before chord major second", () => {
    const chordMajorSecond = {
      practiceModeId: "chord-sing" as const,
      contentTierId: "chord-major-second" as const,
    }
    expect(isCurriculumLessonUnlocked(chordMajorSecond, passingThroughHarmonic2bHistory())).toBe(
      false,
    )
    expect(
      isCurriculumLessonUnlocked(chordMajorSecond, passingMajorDiatonicScaleDegreeHistory()),
    ).toBe(true)
  })

  it("requires minor diatonic scale degrees before chord minor second", () => {
    const chordMinorSecond = {
      practiceModeId: "chord-sing" as const,
      contentTierId: "chord-minor-second" as const,
    }
    expect(isCurriculumLessonUnlocked(chordMinorSecond, passingChordMajorSecondHistory())).toBe(
      false,
    )
    const minorDiatonicComplete = [
      ...passingChordMajorSecondHistory(),
      ...passingStepHistory({
        practiceModeId: "scale-degree-sing",
        contentTierId: "degree-minor-diatonic",
      }),
    ]
    expect(isCurriculumLessonUnlocked(chordMinorSecond, minorDiatonicComplete)).toBe(true)
  })

  it("describes harmonic sing predecessor for chord-sing", () => {
    expect(getUnlockRequirement("chord-sing")).toEqual({
      predecessorPracticeModeId: "interval-harmonic-sing",
      predecessorLabel: "Sing harmonic intervals (perfect 4th, 5th, octave)",
      minExercisesForUnlock: MIN_EXERCISES_FOR_UNLOCK,
      minPassRatePercent: MIN_EXERCISE_PASS_RATE,
    })
  })
})
