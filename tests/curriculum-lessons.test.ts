import { describe, expect, it } from "vitest"
import {
  getChordLessonBannerLabel,
  getChordQualityIdLessonBannerLabel,
  getChordQualityIdTierConfig,
  getChordTierConfig,
  getEligibleTriadQualityIds,
  getEligibleVoicingPositionIds,
} from "../src/curriculum/chord-tiers.ts"
import {
  CURRICULUM_LESSONS,
  curriculumLessonsForPracticeMode,
  getCurriculumLessonIndex,
  getEligibleIntervalIds,
  getEligibleTagIds,
} from "../src/curriculum/curriculum-lessons.ts"
import { DIATONIC_MAJOR_INTERVAL_IDS, INTERVAL_2A_IDS } from "../src/interval-config.ts"
import {
  DEGREE_MAJOR_DIATONIC_IDS,
  DEGREE_MAJOR_INTRO_IDS,
  DEGREE_MINOR_DIATONIC_IDS,
} from "../src/scale-degree-config.ts"
import { defined } from "./helpers/defined.ts"

function findCurriculumLesson(
  predicate: (step: (typeof CURRICULUM_LESSONS)[number]) => boolean,
  label: string,
) {
  return defined(CURRICULUM_LESSONS.find(predicate), label)
}

describe("curriculum steps", () => {
  it("defines guided steps in cross-mode unlock order through chord minor second", () => {
    expect(CURRICULUM_LESSONS.map((s) => `${s.practiceModeId}@${s.contentTierId}`)).toEqual([
      "single-note@tier-1",
      "interval-melodic-sing@interval-2a",
      "interval-named-sing@interval-2a",
      "interval-melodic-id@interval-2a",
      "interval-harmonic-sing@interval-2a",
      "chord-sing@chord-major-root",
      "interval-harmonic-id@interval-2a",
      "chord-sing@chord-minor-root",
      "chord-quality-id@chord-quality-root",
      "scale-degree-sing@degree-major-intro",
      "interval-melodic-sing@interval-2b",
      "chord-sing@chord-major-first",
      "interval-named-sing@interval-2b",
      "chord-sing@chord-minor-first",
      "chord-quality-id@chord-quality-first",
      "interval-melodic-id@interval-2b",
      "interval-harmonic-sing@interval-2b",
      "interval-harmonic-id@interval-2b",
      "scale-degree-sing@degree-major-diatonic",
      "chord-sing@chord-major-second",
      "scale-degree-sing@degree-minor-diatonic",
      "chord-sing@chord-minor-second",
    ])
  })

  it("places interval 2a tags inside the 2b diatonic pool", () => {
    const twoA = getEligibleIntervalIds("interval-2a")
    const twoB = getEligibleIntervalIds("interval-2b")
    expect(twoB).toHaveLength(12)
    for (const id of twoA) {
      expect(twoB).toContain(id)
    }
    expect(twoA).toEqual([...INTERVAL_2A_IDS])
    expect(twoB).toEqual([...DIATONIC_MAJOR_INTERVAL_IDS])
  })

  it("exposes twelve tags for interval 2b steps", () => {
    const harmonicSing2b = findCurriculumLesson(
      (s) => s.practiceModeId === "interval-harmonic-sing" && s.contentTierId === "interval-2b",
      "harmonic sing 2b",
    )
    expect(getEligibleTagIds(harmonicSing2b)).toHaveLength(12)
  })

  it("orders interval 2a in cross-mode sequence before intro scale degrees", () => {
    const melodicSing2a = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    })
    const namedSing2a = getCurriculumLessonIndex({
      practiceModeId: "interval-named-sing",
      contentTierId: "interval-2a",
    })
    const melodicId2a = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2a",
    })
    const harmonicSing2a = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2a",
    })
    const chordMajorRoot = getCurriculumLessonIndex({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-root",
    })
    const harmonicId2a = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    })
    const chordMinorRoot = getCurriculumLessonIndex({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-root",
    })
    const chordQualityRoot = getCurriculumLessonIndex({
      practiceModeId: "chord-quality-id",
      contentTierId: "chord-quality-root",
    })
    const introDegrees = getCurriculumLessonIndex({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    })
    const melodicSing2b = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    })
    expect(melodicSing2a).toBe(1)
    expect(namedSing2a).toBe(2)
    expect(melodicId2a).toBe(3)
    expect(harmonicSing2a).toBe(4)
    expect(chordMajorRoot).toBe(5)
    expect(harmonicId2a).toBe(6)
    expect(chordMinorRoot).toBe(7)
    expect(chordQualityRoot).toBe(8)
    expect(introDegrees).toBe(9)
    expect(melodicSing2b).toBe(10)
    expect(chordMajorRoot).toBeGreaterThan(harmonicSing2a)
    expect(harmonicId2a).toBeGreaterThan(chordMajorRoot)
    expect(chordMinorRoot).toBeGreaterThan(harmonicId2a)
    expect(chordQualityRoot).toBeGreaterThan(chordMinorRoot)
    expect(introDegrees).toBeGreaterThan(chordQualityRoot)
    expect(melodicSing2b).toBeGreaterThan(introDegrees)
  })

  it("orders 2b steps in cross-mode sequence with chord tiers interleaved", () => {
    const introDegrees = getCurriculumLessonIndex({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    })
    const melodicSing2b = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    })
    const chordMajorFirst = getCurriculumLessonIndex({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-first",
    })
    const namedSing2b = getCurriculumLessonIndex({
      practiceModeId: "interval-named-sing",
      contentTierId: "interval-2b",
    })
    const chordMinorFirst = getCurriculumLessonIndex({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-first",
    })
    const chordQualityFirst = getCurriculumLessonIndex({
      practiceModeId: "chord-quality-id",
      contentTierId: "chord-quality-first",
    })
    const melodicId2b = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2b",
    })
    const harmonicSing2b = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    })
    const harmonicId2b = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    })
    const majorDiatonicDegrees = getCurriculumLessonIndex({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-diatonic",
    })
    expect(introDegrees).toBe(9)
    expect(melodicSing2b).toBe(10)
    expect(chordMajorFirst).toBe(11)
    expect(namedSing2b).toBe(12)
    expect(chordMinorFirst).toBe(13)
    expect(chordQualityFirst).toBe(14)
    expect(melodicId2b).toBe(15)
    expect(harmonicSing2b).toBe(16)
    expect(harmonicId2b).toBe(17)
    expect(majorDiatonicDegrees).toBe(18)
    const chordMajorSecond = getCurriculumLessonIndex({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-second",
    })
    const minorDiatonicDegrees = getCurriculumLessonIndex({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-minor-diatonic",
    })
    const chordMinorSecond = getCurriculumLessonIndex({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-second",
    })
    expect(chordMajorSecond).toBe(19)
    expect(minorDiatonicDegrees).toBe(20)
    expect(chordMinorSecond).toBe(21)
    expect(melodicSing2b).toBeGreaterThan(introDegrees)
    expect(chordMajorFirst).toBeGreaterThan(melodicSing2b)
    expect(namedSing2b).toBeGreaterThan(chordMajorFirst)
    expect(chordMinorFirst).toBeGreaterThan(namedSing2b)
    expect(chordQualityFirst).toBeGreaterThan(chordMinorFirst)
    expect(melodicId2b).toBeGreaterThan(chordQualityFirst)
    expect(harmonicSing2b).toBeGreaterThan(melodicId2b)
    expect(harmonicId2b).toBeGreaterThan(harmonicSing2b)
    expect(majorDiatonicDegrees).toBeGreaterThan(harmonicId2b)
    expect(chordMajorSecond).toBeGreaterThan(majorDiatonicDegrees)
    expect(minorDiatonicDegrees).toBeGreaterThan(chordMajorSecond)
    expect(chordMinorSecond).toBeGreaterThan(minorDiatonicDegrees)
  })

  it("returns ordered steps per exercise for tier progression", () => {
    expect(
      curriculumLessonsForPracticeMode("interval-melodic-sing").map((s) => s.contentTierId),
    ).toEqual(["interval-2a", "interval-2b"])
    expect(
      curriculumLessonsForPracticeMode("interval-named-sing").map((s) => s.contentTierId),
    ).toEqual(["interval-2a", "interval-2b"])
    expect(
      curriculumLessonsForPracticeMode("interval-harmonic-sing").map((s) => s.contentTierId),
    ).toEqual(["interval-2a", "interval-2b"])
    expect(
      curriculumLessonsForPracticeMode("scale-degree-sing").map((s) => s.contentTierId),
    ).toEqual(["degree-major-intro", "degree-major-diatonic", "degree-minor-diatonic"])
    expect(curriculumLessonsForPracticeMode("chord-sing").map((s) => s.contentTierId)).toEqual([
      "chord-major-root",
      "chord-minor-root",
      "chord-major-first",
      "chord-minor-first",
      "chord-major-second",
      "chord-minor-second",
    ])
    expect(
      curriculumLessonsForPracticeMode("chord-quality-id").map((s) => s.contentTierId),
    ).toEqual(["chord-quality-root", "chord-quality-first"])
  })

  it("presets degree-major-intro tags from the intro pool", () => {
    const step = findCurriculumLesson(
      (s) => s.contentTierId === "degree-major-intro",
      "degree-major-intro",
    )
    expect(getEligibleTagIds(step)).toEqual([...DEGREE_MAJOR_INTRO_IDS])
  })

  it("places intro degree tags inside the major diatonic pool", () => {
    const intro = getEligibleTagIds(
      findCurriculumLesson((s) => s.contentTierId === "degree-major-intro", "degree-major-intro"),
    )
    const diatonic = getEligibleTagIds(
      findCurriculumLesson(
        (s) => s.contentTierId === "degree-major-diatonic",
        "degree-major-diatonic",
      ),
    )
    expect(diatonic).toHaveLength(7)
    for (const id of intro) {
      expect(diatonic).toContain(id)
    }
    expect(diatonic).toEqual([...DEGREE_MAJOR_DIATONIC_IDS])
  })

  it("uses the same ordinal ids for major and natural minor diatonic pools", () => {
    const major = getEligibleTagIds(
      findCurriculumLesson(
        (s) => s.contentTierId === "degree-major-diatonic",
        "degree-major-diatonic",
      ),
    )
    const minor = getEligibleTagIds(
      findCurriculumLesson(
        (s) => s.contentTierId === "degree-minor-diatonic",
        "degree-minor-diatonic",
      ),
    )
    expect(major).toEqual([...DEGREE_MAJOR_DIATONIC_IDS])
    expect(minor).toEqual([...DEGREE_MINOR_DIATONIC_IDS])
    expect(minor).toEqual(major)
  })

  it("presets voicing position tags on each chord tier", () => {
    for (const contentTierId of [
      "chord-major-root",
      "chord-minor-root",
      "chord-major-first",
      "chord-minor-first",
      "chord-major-second",
      "chord-minor-second",
    ] as const) {
      const step = findCurriculumLesson(
        (s) => s.practiceModeId === "chord-sing" && s.contentTierId === contentTierId,
        contentTierId,
      )
      expect(getEligibleTagIds(step)).toEqual(getEligibleVoicingPositionIds())
    }
  })

  it("fixes triad quality and inversion per chord content tier", () => {
    expect(getChordTierConfig("chord-major-root")).toEqual({
      triadQualityId: "major-triad",
      inversion: "root",
    })
    expect(getChordTierConfig("chord-minor-root")).toEqual({
      triadQualityId: "minor-triad",
      inversion: "root",
    })
    expect(getChordTierConfig("chord-major-first")).toEqual({
      triadQualityId: "major-triad",
      inversion: "first",
    })
    expect(getChordTierConfig("chord-minor-first")).toEqual({
      triadQualityId: "minor-triad",
      inversion: "first",
    })
    expect(getChordTierConfig("chord-major-second")).toEqual({
      triadQualityId: "major-triad",
      inversion: "second",
    })
    expect(getChordTierConfig("chord-minor-second")).toEqual({
      triadQualityId: "minor-triad",
      inversion: "second",
    })
  })

  it("fixes inversion per chord quality identify tier and exposes triad quality tags", () => {
    expect(getChordQualityIdTierConfig("chord-quality-root")).toEqual({ inversion: "root" })
    expect(getChordQualityIdTierConfig("chord-quality-first")).toEqual({ inversion: "first" })
    expect(getChordQualityIdLessonBannerLabel("chord-quality-root")).toBe("Root position")
    expect(getChordQualityIdLessonBannerLabel("chord-quality-first")).toBe("1st inversion")
    const qualityFirst = findCurriculumLesson(
      (s) => s.practiceModeId === "chord-quality-id" && s.contentTierId === "chord-quality-first",
      "chord-quality-first",
    )
    expect(getEligibleTagIds(qualityFirst)).toEqual(getEligibleTriadQualityIds())
  })

  it("labels chord lesson banners with quality and inversion", () => {
    expect(getChordLessonBannerLabel("chord-major-root")).toBe("Major triad · root position")
    expect(getChordLessonBannerLabel("chord-minor-root")).toBe("Minor triad · root position")
    expect(getChordLessonBannerLabel("chord-major-first")).toBe("Major triad · 1st inversion")
    expect(getChordLessonBannerLabel("chord-minor-first")).toBe("Minor triad · 1st inversion")
    expect(getChordLessonBannerLabel("chord-major-second")).toBe("Major triad · 2nd inversion")
    expect(getChordLessonBannerLabel("chord-minor-second")).toBe("Minor triad · 2nd inversion")
  })
})
