import { describe, expect, it } from "vitest";
import {
  CURRICULUM_LEVELS,
  CURRICULUM_PATH,
  FREE_PRACTICE_IDS,
} from "../src/curriculum/levels.ts";

describe("curriculum levels", () => {
  it("defines guided path in unlock order", () => {
    expect(CURRICULUM_PATH).toEqual([
      "single-note",
      "interval-melodic-sing",
      "interval-harmonic-sing",
      "interval-melodic-id",
      "interval-harmonic-id",
    ]);
  });

  it("keeps path exercises disjoint from free practice", () => {
    for (const id of FREE_PRACTICE_IDS) {
      expect(CURRICULUM_PATH).not.toContain(id);
    }
  });

  it("covers every path exercise in a level", () => {
    const fromLevels = CURRICULUM_LEVELS.flatMap((l) => l.exerciseIds);
    expect(fromLevels).toEqual([...CURRICULUM_PATH]);
  });
});
