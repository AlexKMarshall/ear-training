import { describe, expect, it } from "vitest"
import { CURRICULUM_LEVELS, CURRICULUM_PATH } from "../src/curriculum/levels.ts"

describe("curriculum levels", () => {
  it("defines guided path in unlock order", () => {
    expect(CURRICULUM_PATH).toEqual([
      "single-note",
      "interval-melodic-sing",
      "interval-named-sing",
      "interval-harmonic-sing",
      "interval-melodic-id",
      "interval-harmonic-id",
      "scale-degree-sing",
      "chord-middle",
    ])
  })

  it("covers every path exercise in a level", () => {
    const fromLevels = CURRICULUM_LEVELS.flatMap((l) => l.practiceModeIds)
    expect(fromLevels).toEqual([...CURRICULUM_PATH])
  })
})
