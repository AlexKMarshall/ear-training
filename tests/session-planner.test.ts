import { describe, expect, it } from "vitest";
import { MIN_EXERCISES_FOR_UNLOCK } from "../src/curriculum/unlock.ts";
import type { ContentTierId } from "../src/curriculum/curriculum-lessons.ts";
import { filterRecordsForCurriculumLesson } from "../src/curriculum/curriculum-lessons.ts";
import {
  planNextExerciseTag,
  WEAK_AREA_PROBABILITY,
} from "../src/session/planner.ts";
import { DIATONIC_MAJOR_INTERVAL_IDS } from "../src/interval-config.ts";
import { attempt } from "./fixtures/attempts.ts";
import type { AttemptRecord } from "../src/history/types.ts";

function withTier(
  record: AttemptRecord,
  contentTierId: ContentTierId,
): AttemptRecord {
  return { ...record, contentTierId } as AttemptRecord;
}

function intervalHistory(
  practiceModeId: AttemptRecord["practiceModeId"],
  tagId: string,
  options: {
    lessonExercises: number;
    passRate: number;
    contentTierId?: ContentTierId;
  },
): AttemptRecord[] {
  const passedCount = Math.round((options.lessonExercises * options.passRate) / 100);
  const records: AttemptRecord[] = [];
  for (let i = 0; i < options.lessonExercises; i++) {
    const passed = i < passedCount;
    const base = attempt({
      practiceModeId,
      passed,
      attemptNumber: 1,
      centsOff: passed ? 5 : 40,
      intervalId: tagId,
      exerciseIndex: i,
      lessonId: `${tagId}-${i}`,
    });
    records.push(
      options.contentTierId
        ? withTier(base, options.contentTierId)
        : base,
    );
  }
  return records;
}

describe("filterRecordsForCurriculumLesson", () => {
  it("keeps only matching practiceModeId", () => {
    const step = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const records = [
      attempt({ practiceModeId: "interval-melodic-sing", intervalId: "perfect-fourth" }),
      attempt({ practiceModeId: "interval-harmonic-sing", intervalId: "perfect-fifth" }),
    ];
    expect(filterRecordsForCurriculumLesson(records, step)).toHaveLength(1);
  });

  it("excludes other content tiers when contentTierId is on records", () => {
    const step = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const records = [
      withTier(
        attempt({
          practiceModeId: "interval-melodic-sing",
          intervalId: "minor-second",
          passed: false,
          attemptNumber: 1,
          centsOff: 50,
        }),
        "interval-2b",
      ),
      attempt({
        practiceModeId: "interval-melodic-sing",
        intervalId: "perfect-fourth",
        passed: true,
        attemptNumber: 1,
        centsOff: 5,
      }),
    ];
    expect(filterRecordsForCurriculumLesson(records, step)).toHaveLength(1);
    expect(filterRecordsForCurriculumLesson(records, step)[0]!.intervalId).toBe(
      "perfect-fourth",
    );
  });

  it("does not count legacy untagged attempts toward interval-2b", () => {
    const step = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2b" as const,
    };
    const records = [
      attempt({
        practiceModeId: "interval-melodic-sing",
        intervalId: "perfect-fourth",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
    ];
    expect(filterRecordsForCurriculumLesson(records, step)).toHaveLength(0);
  });
});

describe("planNextExerciseTag", () => {
  const melodicSing2b = {
    practiceModeId: "interval-melodic-sing" as const,
    contentTierId: "interval-2b" as const,
  };

  it("draws only from the step eligible pool", () => {
    const tag = planNextExerciseTag(melodicSing2b, []);
    expect(DIATONIC_MAJOR_INTERVAL_IDS).toContain(tag);
  });

  it("treats untested tags as weak and picks uniformly when all are untested", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 600; i++) {
      const tag = planNextExerciseTag(melodicSing2b, [], () => Math.random());
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    for (const id of DIATONIC_MAJOR_INTERVAL_IDS) {
      expect(counts.get(id)).toBeGreaterThan(20);
    }
  });

  it("overweights a weak tag in a large 2b pool", () => {
    const strongTags = DIATONIC_MAJOR_INTERVAL_IDS.filter(
      (id) => id !== "minor-sixth",
    );
    const records: AttemptRecord[] = [];
    for (const tagId of strongTags) {
      records.push(
        ...intervalHistory("interval-melodic-sing", tagId, {
          lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
          passRate: 100,
          contentTierId: "interval-2b",
        }),
      );
    }
    records.push(
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 20,
        contentTierId: "interval-2b",
      }),
    );

    let weakPicks = 0;
    for (let i = 0; i < 400; i++) {
      if (planNextExerciseTag(melodicSing2b, records) === "minor-sixth") {
        weakPicks += 1;
      }
    }
    expect(weakPicks).toBeGreaterThan(120);
  });

  it("uses maintenance pool when rng exceeds weak probability", () => {
    const records = [
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 10,
        contentTierId: "interval-2b",
      }),
      ...intervalHistory("interval-melodic-sing", "perfect-fifth", {
        lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
        passRate: 100,
        contentTierId: "interval-2b",
      }),
    ];
    const tag = planNextExerciseTag(
      melodicSing2b,
      records,
      () => WEAK_AREA_PROBABILITY + 0.01,
    );
    expect(tag).toBe("perfect-fifth");
  });

  it("classifies tags with pass rate below threshold as weak", () => {
    const records: AttemptRecord[] = [];
    for (const tagId of DIATONIC_MAJOR_INTERVAL_IDS) {
      if (tagId === "major-second") {
        records.push(
          ...intervalHistory("interval-melodic-sing", tagId, {
            lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
            passRate: 60,
            contentTierId: "interval-2b",
          }),
        );
      } else {
        records.push(
          ...intervalHistory("interval-melodic-sing", tagId, {
            lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
            passRate: 100,
            contentTierId: "interval-2b",
          }),
        );
      }
    }
    let picks = 0;
    for (let i = 0; i < 200; i++) {
      if (planNextExerciseTag(melodicSing2b, records) === "major-second") {
        picks += 1;
      }
    }
    expect(picks).toBeGreaterThan(100);
  });

  it("ignores 2b history when planning a 2a step", () => {
    const step2a = {
      practiceModeId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const records = intervalHistory("interval-melodic-sing", "minor-second", {
      lessonExercises: MIN_EXERCISES_FOR_UNLOCK,
      passRate: 0,
      contentTierId: "interval-2b",
    });
    const counts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      counts.add(planNextExerciseTag(step2a, records));
    }
    expect(counts.has("minor-second")).toBe(false);
    expect([...counts].every((id) =>
      ["perfect-fourth", "perfect-fifth", "perfect-octave"].includes(id),
    )).toBe(true);
  });

  it("draws scale degrees from the degree-major-intro pool", () => {
    const step = {
      practiceModeId: "scale-degree-sing" as const,
      contentTierId: "degree-major-intro" as const,
    };
    const counts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      counts.add(planNextExerciseTag(step, []));
    }
    expect([...counts].every((id) =>
      ["fourth", "fifth", "octave"].includes(id),
    )).toBe(true);
  });

  it("draws scale degrees from the degree-major-diatonic pool", () => {
    const step = {
      practiceModeId: "scale-degree-sing" as const,
      contentTierId: "degree-major-diatonic" as const,
    };
    const counts = new Set<string>();
    for (let i = 0; i < 50; i++) {
      counts.add(planNextExerciseTag(step, []));
    }
    expect(counts.has("second")).toBe(true);
    expect(counts.has("seventh")).toBe(true);
    expect([...counts].every((id) =>
      ["second", "third", "fourth", "fifth", "sixth", "seventh", "octave"].includes(id),
    )).toBe(true);
  });

  it("draws chord types from the chord-1a pool", () => {
    const step = {
      practiceModeId: "chord-middle" as const,
      contentTierId: "chord-1a" as const,
    };
    const counts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      counts.add(planNextExerciseTag(step, []));
    }
    expect([...counts].every((id) =>
      [
        "major-triad-sing-middle",
        "minor-triad-sing-middle",
        "diminished-triad-sing-middle",
      ].includes(id),
    )).toBe(true);
  });
});
