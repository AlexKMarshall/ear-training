import { describe, expect, it } from "vitest"
import {
  formatPathNodeStatus,
  getNextLockedPathNode,
  getPathNodeLabels,
  getPathNodeState,
  isGuidedPathComplete,
} from "../src/curriculum/path-node.ts"
import {
  passingFullGuidedPathHistory,
  passingLevel2History,
  passingSingleNoteHistory,
  passingThroughHarmonic2bHistory,
} from "./fixtures/attempts.ts"

describe("getPathNodeLabels", () => {
  it("uses family title and mode subtitle for interval steps", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "interval-melodic-sing",
        contentTierId: "interval-2a",
      }),
    ).toEqual({
      title: "Intervals",
      subtitle: "Melodic reproduction · perfect 4th, 5th, octave",
    })
    expect(
      getPathNodeLabels({
        practiceModeId: "interval-named-sing",
        contentTierId: "interval-2a",
      }),
    ).toEqual({
      title: "Intervals",
      subtitle: "Named-interval reproduction · perfect 4th, 5th, octave",
    })
  })

  it("uses family title and key-quality subtitle for intro scale degrees", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "scale-degree-sing",
        contentTierId: "degree-major-intro",
      }),
    ).toEqual({
      title: "Scale degrees",
      subtitle: "Melodic reproduction · major key · 4th, 5th, octave",
    })
  })

  it("uses family title and diatonic pool subtitle for major diatonic scale degrees", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "scale-degree-sing",
        contentTierId: "degree-major-diatonic",
      }),
    ).toEqual({
      title: "Scale degrees",
      subtitle: "Melodic reproduction · major key · diatonic degrees within one octave",
    })
  })

  it("uses family title and key-quality subtitle for minor diatonic scale degrees", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "scale-degree-sing",
        contentTierId: "degree-minor-diatonic",
      }),
    ).toEqual({
      title: "Scale degrees",
      subtitle: "Melodic reproduction · natural minor key · diatonic degrees within one octave",
    })
  })

  it("uses quality identification subtitle for chord quality identify steps", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "chord-quality-id",
        contentTierId: "chord-quality-first",
      }),
    ).toEqual({
      title: "Chords",
      subtitle: "Quality identification · 1st inversion",
    })
    expect(
      getPathNodeLabels({
        practiceModeId: "chord-quality-id",
        contentTierId: "chord-quality-second",
      }),
    ).toEqual({
      title: "Chords",
      subtitle: "Quality identification · 2nd inversion",
    })
  })

  it("uses inversion identification subtitle for chord inversion identify steps", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "chord-inversion-id",
        contentTierId: "chord-inversion-major",
      }),
    ).toEqual({
      title: "Chords",
      subtitle: "Inversion identification · major triad",
    })
    expect(
      getPathNodeLabels({
        practiceModeId: "chord-inversion-id",
        contentTierId: "chord-inversion-minor",
      }),
    ).toEqual({
      title: "Chords",
      subtitle: "Inversion identification · minor triad",
    })
  })

  it("uses chord tier banner and any-voice subtitle for chord steps", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "chord-sing",
        contentTierId: "chord-minor-first",
      }),
    ).toEqual({
      title: "Chords",
      subtitle: "Minor triad · 1st inversion · any voice",
    })
  })

  it("labels second-inversion chord steps", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "chord-sing",
        contentTierId: "chord-major-second",
      }),
    ).toEqual({
      title: "Chords",
      subtitle: "Major triad · 2nd inversion · any voice",
    })
  })

  it("labels major pooled-inversion capstone", () => {
    expect(
      getPathNodeLabels({
        practiceModeId: "chord-sing",
        contentTierId: "chord-major-inversions",
      }),
    ).toEqual({
      title: "Chords",
      subtitle: "Major triad · all inversions · any voice",
    })
  })
})

describe("getPathNodeState", () => {
  it("marks the first step current on a fresh profile", () => {
    const step = { practiceModeId: "single-note" as const, contentTierId: "tier-1" as const }
    expect(getPathNodeState(step, [])).toBe("current")
    expect(
      getPathNodeState(
        { practiceModeId: "interval-melodic-sing", contentTierId: "interval-2a" },
        [],
      ),
    ).toBe("locked")
  })

  it("marks completed steps passed after single-note threshold", () => {
    const records = passingSingleNoteHistory()
    expect(
      getPathNodeState({ practiceModeId: "single-note", contentTierId: "tier-1" }, records),
    ).toBe("passed")
    expect(
      getPathNodeState(
        { practiceModeId: "interval-melodic-sing", contentTierId: "interval-2a" },
        records,
      ),
    ).toBe("current")
  })
})

describe("getNextLockedPathNode", () => {
  it("returns the step after the current node when practice is in progress", () => {
    expect(getNextLockedPathNode(passingSingleNoteHistory())).toEqual({
      practiceModeId: "interval-named-sing",
      contentTierId: "interval-2a",
    })
  })

  it("returns null when the path is complete", () => {
    expect(getNextLockedPathNode(passingFullGuidedPathHistory())).toBe(null)
  })
})

describe("formatPathNodeStatus", () => {
  it("shows predecessor unlock copy only on the next locked node", () => {
    const records = passingSingleNoteHistory()
    expect(
      formatPathNodeStatus(
        { practiceModeId: "interval-melodic-sing", contentTierId: "interval-2a" },
        records,
      ),
    ).toContain("exercises")
    expect(
      formatPathNodeStatus(
        { practiceModeId: "interval-named-sing", contentTierId: "interval-2a" },
        records,
      ),
    ).toContain("Sing melodic intervals")
    expect(
      formatPathNodeStatus(
        { practiceModeId: "interval-harmonic-sing", contentTierId: "interval-2a" },
        records,
      ),
    ).toBe("Locked")
  })
})

describe("isGuidedPathComplete", () => {
  it("is false until every step meets thresholds", () => {
    expect(isGuidedPathComplete(passingThroughHarmonic2bHistory())).toBe(false)
    expect(isGuidedPathComplete(passingFullGuidedPathHistory())).toBe(true)
  })

  it("is false when level 2 at 2a is complete but 2b is not started", () => {
    expect(isGuidedPathComplete(passingLevel2History())).toBe(false)
  })
})
