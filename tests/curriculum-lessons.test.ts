import { describe, expect, it } from "vitest";
import {
  CURRICULUM_LESSONS,
  getEligibleChordTypeIds,
  getEligibleInversionIds,
  getEligibleIntervalIds,
  getEligibleTagIds,
  getCurriculumLessonIndex,
  curriculumLessonsForPracticeMode,
} from "../src/curriculum/curriculum-lessons.ts";
import {
  DIATONIC_MAJOR_INTERVAL_IDS,
  INTERVAL_2A_IDS,
} from "../src/interval-config.ts";
import {
  DEGREE_MAJOR_DIATONIC_IDS,
  DEGREE_MAJOR_INTRO_IDS,
} from "../src/scale-degree-config.ts";

describe("curriculum steps", () => {
  it("defines guided steps in cross-mode unlock order through chord middle", () => {
    expect(CURRICULUM_LESSONS.map((s) => `${s.practiceModeId}@${s.contentTierId}`)).toEqual([
      "single-note@tier-1",
      "interval-melodic-sing@interval-2a",
      "interval-melodic-id@interval-2a",
      "interval-harmonic-sing@interval-2a",
      "interval-harmonic-id@interval-2a",
      "scale-degree-sing@degree-major-intro",
      "interval-melodic-sing@interval-2b",
      "interval-melodic-id@interval-2b",
      "interval-harmonic-sing@interval-2b",
      "interval-harmonic-id@interval-2b",
      "scale-degree-sing@degree-major-diatonic",
      "chord-middle@chord-1a",
    ]);
  });

  it("places interval 2a tags inside the 2b diatonic pool", () => {
    const twoA = getEligibleIntervalIds("interval-2a");
    const twoB = getEligibleIntervalIds("interval-2b");
    expect(twoB).toHaveLength(12);
    for (const id of twoA) {
      expect(twoB).toContain(id);
    }
    expect(twoA).toEqual([...INTERVAL_2A_IDS]);
    expect(twoB).toEqual([...DIATONIC_MAJOR_INTERVAL_IDS]);
  });

  it("exposes twelve tags for interval 2b steps", () => {
    const harmonicSing2b = CURRICULUM_LESSONS.find(
      (s) =>
        s.practiceModeId === "interval-harmonic-sing" &&
        s.contentTierId === "interval-2b",
    )!;
    expect(getEligibleTagIds(harmonicSing2b)).toHaveLength(12);
  });

  it("orders interval 2a in cross-mode sequence before intro scale degrees", () => {
    const melodicSing2a = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2a",
    });
    const melodicId2a = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2a",
    });
    const harmonicSing2a = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2a",
    });
    const harmonicId2a = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    });
    const introDegrees = getCurriculumLessonIndex({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    });
    const melodicSing2b = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
    expect(melodicSing2a).toBe(1);
    expect(melodicId2a).toBe(2);
    expect(harmonicSing2a).toBe(3);
    expect(harmonicId2a).toBe(4);
    expect(introDegrees).toBe(5);
    expect(melodicSing2b).toBe(6);
    expect(melodicId2a).toBeGreaterThan(melodicSing2a);
    expect(harmonicSing2a).toBeGreaterThan(melodicId2a);
    expect(harmonicId2a).toBeGreaterThan(harmonicSing2a);
    expect(introDegrees).toBeGreaterThan(harmonicId2a);
    expect(melodicSing2b).toBeGreaterThan(introDegrees);
  });

  it("orders 2b steps in cross-mode sequence after intro scale degrees", () => {
    const introDegrees = getCurriculumLessonIndex({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    });
    const melodicSing2b = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    });
    const melodicId2b = getCurriculumLessonIndex({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2b",
    });
    const harmonicSing2b = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    });
    const harmonicId2b = getCurriculumLessonIndex({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    });
    const majorDiatonicDegrees = getCurriculumLessonIndex({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-diatonic",
    });
    const chordMiddle = getCurriculumLessonIndex({
      practiceModeId: "chord-middle",
      contentTierId: "chord-1a",
    });
    expect(introDegrees).toBe(5);
    expect(melodicSing2b).toBe(6);
    expect(melodicId2b).toBe(7);
    expect(harmonicSing2b).toBe(8);
    expect(harmonicId2b).toBe(9);
    expect(majorDiatonicDegrees).toBe(10);
    expect(chordMiddle).toBe(11);
    expect(melodicSing2b).toBeGreaterThan(introDegrees);
    expect(harmonicSing2b).toBeGreaterThan(melodicId2b);
    expect(harmonicId2b).toBeGreaterThan(harmonicSing2b);
    expect(majorDiatonicDegrees).toBeGreaterThan(harmonicId2b);
    expect(chordMiddle).toBeGreaterThan(majorDiatonicDegrees);
  });

  it("returns ordered steps per exercise for tier progression", () => {
    expect(curriculumLessonsForPracticeMode("interval-melodic-sing").map((s) => s.contentTierId)).toEqual([
      "interval-2a",
      "interval-2b",
    ]);
    expect(curriculumLessonsForPracticeMode("interval-harmonic-sing").map((s) => s.contentTierId)).toEqual([
      "interval-2a",
      "interval-2b",
    ]);
    expect(curriculumLessonsForPracticeMode("scale-degree-sing").map((s) => s.contentTierId)).toEqual([
      "degree-major-intro",
      "degree-major-diatonic",
    ]);
    expect(curriculumLessonsForPracticeMode("chord-middle").map((s) => s.contentTierId)).toEqual([
      "chord-1a",
    ]);
  });

  it("presets degree-major-intro tags from the intro pool", () => {
    const step = CURRICULUM_LESSONS.find((s) => s.contentTierId === "degree-major-intro")!;
    expect(getEligibleTagIds(step)).toEqual([...DEGREE_MAJOR_INTRO_IDS]);
  });

  it("places intro degree tags inside the major diatonic pool", () => {
    const intro = getEligibleTagIds(
      CURRICULUM_LESSONS.find((s) => s.contentTierId === "degree-major-intro")!,
    );
    const diatonic = getEligibleTagIds(
      CURRICULUM_LESSONS.find((s) => s.contentTierId === "degree-major-diatonic")!,
    );
    expect(diatonic).toHaveLength(7);
    for (const id of intro) {
      expect(diatonic).toContain(id);
    }
    expect(diatonic).toEqual([...DEGREE_MAJOR_DIATONIC_IDS]);
  });

  it("presets chord-1a types and inversions on the chord-middle step", () => {
    expect(getEligibleChordTypeIds("chord-1a")).toEqual([
      "major-triad-sing-middle",
      "minor-triad-sing-middle",
      "diminished-triad-sing-middle",
    ]);
    expect(getEligibleInversionIds("chord-1a")).toEqual([
      "root",
      "first",
      "second",
    ]);
    const step = CURRICULUM_LESSONS.find((s) => s.practiceModeId === "chord-middle")!;
    expect(getEligibleTagIds(step)).toEqual(getEligibleChordTypeIds("chord-1a"));
  });
});
