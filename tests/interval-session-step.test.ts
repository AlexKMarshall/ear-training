import { describe, expect, it } from "vitest";
import { INTERVAL_2A_IDS } from "../src/interval-config.ts";
import { DIATONIC_MAJOR_INTERVAL_IDS } from "../src/interval-config.ts";
import { prepareIntervalQuestion } from "../src/ui/interval-session.ts";
import type { SessionPlanner } from "../src/session/planner.ts";
import { passingLevel2History } from "./fixtures/attempts.ts";

const fixedPlanner: SessionPlanner = {
  planNextQuestionTag: () => "perfect-fifth",
};

describe("prepareIntervalQuestion session step", () => {
  it("uses guided default tier for the tag pool", () => {
    const question = prepareIntervalQuestion(
      "interval-melodic-sing",
      "melodic",
      passingLevel2History(),
      fixedPlanner,
    );
    expect(question.contentTierId).toBe("interval-2b");
    expect(question.eligibleTagIds).toEqual([...DIATONIC_MAJOR_INTERVAL_IDS]);
  });

  it("uses explicit session step for guided replay", () => {
    const question = prepareIntervalQuestion(
      "interval-melodic-sing",
      "melodic",
      passingLevel2History(),
      fixedPlanner,
      undefined,
      {
        exerciseId: "interval-melodic-sing",
        contentTierId: "interval-2a",
      },
    );
    expect(question.contentTierId).toBe("interval-2a");
    expect(question.eligibleTagIds).toEqual([...INTERVAL_2A_IDS]);
  });
});
