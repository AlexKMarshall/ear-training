import { describe, expect, it } from "vitest"
import {
  CHORD_SING_MAJOR_ROOT_LESSON,
  getGuidedCurriculumLessonForPracticeMode,
  getSessionCurriculumLessonForPracticeMode,
  resolveSessionCurriculumLesson,
} from "../src/curriculum/session-step.ts"
import {
  passingIntroScaleDegreeHistory,
  passingLevel2History,
  passingMajorDiatonicScaleDegreeHistory,
  passingMelodicSing2bHistory,
  passingSingleNoteHistory,
  passingStepHistory,
  passingThroughHarmonic2bHistory,
  passingThroughHarmonicSing2aHistory,
  passingThroughMelodic2bHistory,
} from "./fixtures/attempts.ts"

describe("getSessionCurriculumLessonForPracticeMode", () => {
  it("returns interval-2a for melodic sing until 2b unlocks", () => {
    const records = passingSingleNoteHistory()
    expect(getSessionCurriculumLessonForPracticeMode("interval-melodic-sing", records)).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    })
  })

  it("returns interval-2b for melodic exercises when that tier is unlocked", () => {
    const records = passingIntroScaleDegreeHistory()
    expect(getSessionCurriculumLessonForPracticeMode("interval-melodic-sing", records)).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    })
    expect(getSessionCurriculumLessonForPracticeMode("interval-melodic-id", records)).toEqual({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2a",
    })
  })

  it("returns interval-2b for melodic identify after named sing at 2b passes", () => {
    const records = [
      ...passingMelodicSing2bHistory(),
      ...passingStepHistory({
        practiceModeId: "interval-named-sing",
        contentTierId: "interval-2b",
      }),
    ]
    expect(getSessionCurriculumLessonForPracticeMode("interval-melodic-id", records)).toEqual({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2b",
    })
  })

  it("returns interval-2a for harmonic exercises until harmonic sing at 2b unlocks", () => {
    const records = passingMelodicSing2bHistory()
    expect(getSessionCurriculumLessonForPracticeMode("interval-harmonic-sing", records)).toEqual({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2a",
    })
    expect(getSessionCurriculumLessonForPracticeMode("interval-harmonic-id", records)).toEqual({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    })
  })

  it("returns interval-2b for harmonic exercises when that tier is unlocked", () => {
    const records = passingThroughMelodic2bHistory()
    expect(getSessionCurriculumLessonForPracticeMode("interval-harmonic-sing", records)).toEqual({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    })
    expect(getSessionCurriculumLessonForPracticeMode("interval-harmonic-id", records)).toEqual({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    })
  })

  it("returns interval-2b for harmonic identify after harmonic sing at 2b passes", () => {
    const records = [
      ...passingThroughMelodic2bHistory(),
      ...passingStepHistory({
        practiceModeId: "interval-harmonic-sing",
        contentTierId: "interval-2b",
      }),
    ]
    expect(getSessionCurriculumLessonForPracticeMode("interval-harmonic-id", records)).toEqual({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    })
  })

  it("returns degree-major-intro for scale-degree sing when interval 2a path is complete", () => {
    const records = passingLevel2History()
    expect(getSessionCurriculumLessonForPracticeMode("scale-degree-sing", records)).toEqual({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    })
  })

  it("returns degree-major-diatonic when interval 2b path is complete", () => {
    expect(
      getSessionCurriculumLessonForPracticeMode(
        "scale-degree-sing",
        passingThroughHarmonic2bHistory(),
      ),
    ).toEqual({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-diatonic",
    })
  })

  it("returns degree-minor-diatonic when major diatonic is complete", () => {
    expect(
      getSessionCurriculumLessonForPracticeMode(
        "scale-degree-sing",
        passingMajorDiatonicScaleDegreeHistory(),
      ),
    ).toEqual({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-minor-diatonic",
    })
  })

  it("returns chord-major-root for chord-sing when that step is unlocked", () => {
    expect(
      getSessionCurriculumLessonForPracticeMode(
        "chord-sing",
        passingThroughHarmonicSing2aHistory(),
      ),
    ).toEqual(CHORD_SING_MAJOR_ROOT_LESSON)
  })

  it("uses guided default (first incomplete tier) instead of highest unlocked", () => {
    const records = passingIntroScaleDegreeHistory()
    expect(getGuidedCurriculumLessonForPracticeMode("interval-melodic-id", records)).toEqual({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2a",
    })
    expect(getGuidedCurriculumLessonForPracticeMode("interval-melodic-sing", records)).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    })
  })

  it("uses URL step for guided replay when tier is below highest unlocked", () => {
    const records = passingIntroScaleDegreeHistory()
    const replay2a = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    }
    expect(
      resolveSessionCurriculumLesson("interval-melodic-sing", records, {
        urlCurriculumLesson: replay2a,
      }),
    ).toEqual(replay2a)
    expect(getSessionCurriculumLessonForPracticeMode("interval-melodic-sing", records)).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    })
  })

  it("ignores URL steps for a different exercise id", () => {
    const records = passingSingleNoteHistory()
    expect(
      resolveSessionCurriculumLesson("interval-melodic-sing", records, {
        urlCurriculumLesson: {
          practiceModeId: "interval-harmonic-id",
          contentTierId: "interval-2a",
        },
      }),
    ).toEqual({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    })
  })
})
