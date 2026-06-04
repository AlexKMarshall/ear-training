import { describe, expect, it } from "vitest";
import { MIN_QUESTIONS } from "../src/curriculum/unlock.ts";
import type { ContentTierId } from "../src/curriculum/steps.ts";
import { filterRecordsForStep } from "../src/curriculum/steps.ts";
import {
  planNextQuestionTag,
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
  exerciseId: AttemptRecord["exerciseId"],
  tagId: string,
  options: {
    questions: number;
    passRate: number;
    contentTierId?: ContentTierId;
  },
): AttemptRecord[] {
  const passedCount = Math.round((options.questions * options.passRate) / 100);
  const records: AttemptRecord[] = [];
  for (let i = 0; i < options.questions; i++) {
    const passed = i < passedCount;
    const base = attempt({
      exerciseId,
      passed,
      attemptNumber: 1,
      centsOff: passed ? 5 : 40,
      intervalId: tagId,
      questionIndex: i,
      roundId: `${tagId}-${i}`,
    });
    records.push(
      options.contentTierId
        ? withTier(base, options.contentTierId)
        : base,
    );
  }
  return records;
}

describe("filterRecordsForStep", () => {
  it("keeps only matching exerciseId", () => {
    const step = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const records = [
      attempt({ exerciseId: "interval-melodic-sing", intervalId: "perfect-fourth" }),
      attempt({ exerciseId: "interval-harmonic-sing", intervalId: "perfect-fifth" }),
    ];
    expect(filterRecordsForStep(records, step)).toHaveLength(1);
  });

  it("excludes other content tiers when contentTierId is on records", () => {
    const step = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const records = [
      withTier(
        attempt({
          exerciseId: "interval-melodic-sing",
          intervalId: "minor-second",
          passed: false,
          attemptNumber: 1,
          centsOff: 50,
        }),
        "interval-2b",
      ),
      attempt({
        exerciseId: "interval-melodic-sing",
        intervalId: "perfect-fourth",
        passed: true,
        attemptNumber: 1,
        centsOff: 5,
      }),
    ];
    expect(filterRecordsForStep(records, step)).toHaveLength(1);
    expect(filterRecordsForStep(records, step)[0]!.intervalId).toBe(
      "perfect-fourth",
    );
  });

  it("does not count legacy untagged attempts toward interval-2b", () => {
    const step = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2b" as const,
    };
    const records = [
      attempt({
        exerciseId: "interval-melodic-sing",
        intervalId: "perfect-fourth",
        passed: true,
        attemptNumber: 1,
        centsOff: 0,
      }),
    ];
    expect(filterRecordsForStep(records, step)).toHaveLength(0);
  });
});

describe("planNextQuestionTag", () => {
  const melodicSing2b = {
    exerciseId: "interval-melodic-sing" as const,
    contentTierId: "interval-2b" as const,
  };

  it("draws only from the step eligible pool", () => {
    const tag = planNextQuestionTag(melodicSing2b, []);
    expect(DIATONIC_MAJOR_INTERVAL_IDS).toContain(tag);
  });

  it("treats untested tags as weak and picks uniformly when all are untested", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 600; i++) {
      const tag = planNextQuestionTag(melodicSing2b, [], () => Math.random());
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
          questions: MIN_QUESTIONS,
          passRate: 100,
          contentTierId: "interval-2b",
        }),
      );
    }
    records.push(
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        questions: MIN_QUESTIONS,
        passRate: 20,
        contentTierId: "interval-2b",
      }),
    );

    let weakPicks = 0;
    for (let i = 0; i < 400; i++) {
      if (planNextQuestionTag(melodicSing2b, records) === "minor-sixth") {
        weakPicks += 1;
      }
    }
    expect(weakPicks).toBeGreaterThan(120);
  });

  it("uses maintenance pool when rng exceeds weak probability", () => {
    const records = [
      ...intervalHistory("interval-melodic-sing", "minor-sixth", {
        questions: MIN_QUESTIONS,
        passRate: 10,
        contentTierId: "interval-2b",
      }),
      ...intervalHistory("interval-melodic-sing", "perfect-fifth", {
        questions: MIN_QUESTIONS,
        passRate: 100,
        contentTierId: "interval-2b",
      }),
    ];
    const tag = planNextQuestionTag(
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
            questions: MIN_QUESTIONS,
            passRate: 60,
            contentTierId: "interval-2b",
          }),
        );
      } else {
        records.push(
          ...intervalHistory("interval-melodic-sing", tagId, {
            questions: MIN_QUESTIONS,
            passRate: 100,
            contentTierId: "interval-2b",
          }),
        );
      }
    }
    let picks = 0;
    for (let i = 0; i < 200; i++) {
      if (planNextQuestionTag(melodicSing2b, records) === "major-second") {
        picks += 1;
      }
    }
    expect(picks).toBeGreaterThan(100);
  });

  it("ignores 2b history when planning a 2a step", () => {
    const step2a = {
      exerciseId: "interval-melodic-sing" as const,
      contentTierId: "interval-2a" as const,
    };
    const records = intervalHistory("interval-melodic-sing", "minor-second", {
      questions: MIN_QUESTIONS,
      passRate: 0,
      contentTierId: "interval-2b",
    });
    const counts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      counts.add(planNextQuestionTag(step2a, records));
    }
    expect(counts.has("minor-second")).toBe(false);
    expect([...counts].every((id) =>
      ["perfect-fourth", "perfect-fifth", "perfect-octave"].includes(id),
    )).toBe(true);
  });

  it("draws scale degrees from the degree-3a pool", () => {
    const step = {
      exerciseId: "scale-degree-sing" as const,
      contentTierId: "degree-3a" as const,
    };
    const counts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      counts.add(planNextQuestionTag(step, []));
    }
    expect([...counts].every((id) =>
      ["fourth", "fifth", "octave"].includes(id),
    )).toBe(true);
  });

  it("draws chord types from the chord-1a pool", () => {
    const step = {
      exerciseId: "chord-middle" as const,
      contentTierId: "chord-1a" as const,
    };
    const counts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      counts.add(planNextQuestionTag(step, []));
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
