import { describe, expect, it } from "vitest";
import { INTERVAL_2A_IDS } from "../src/interval-config.ts";
import { DIATONIC_MAJOR_INTERVAL_IDS } from "../src/interval-config.ts";
import { prepareIntervalExercise } from "../src/ui/interval-session.ts";
import type { SessionPlanner } from "../src/session/planner.ts";
import { passingLevel2History } from "./fixtures/attempts.ts";

const fixedPlanner: SessionPlanner = {
  planNextExerciseTag: () => "perfect-fifth",
};

describe("prepareIntervalExercise session step", () => {
  it("uses guided default tier for the tag pool", () => {
    const exercise = prepareIntervalExercise(
      "interval-melodic-sing",
      "melodic",
      passingLevel2History(),
      fixedPlanner,
    );
    expect(exercise.contentTierId).toBe("interval-2b");
    expect(exercise.eligibleTagIds).toEqual([...DIATONIC_MAJOR_INTERVAL_IDS]);
  });

  it("uses explicit session step for guided replay", () => {
    const exercise = prepareIntervalExercise(
      "interval-melodic-sing",
      "melodic",
      passingLevel2History(),
      fixedPlanner,
      undefined,
      {
        practiceModeId: "interval-melodic-sing",
        contentTierId: "interval-2a",
      },
    );
    expect(exercise.contentTierId).toBe("interval-2a");
    expect(exercise.eligibleTagIds).toEqual([...INTERVAL_2A_IDS]);
  });
});
