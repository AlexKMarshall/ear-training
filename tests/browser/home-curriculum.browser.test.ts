import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { page } from "vitest/browser"
import {
  passingFullGuidedPathHistory,
  passingIntroScaleDegreeHistory,
  passingLevel2History,
  passingMajorDiatonicScaleDegreeHistory,
  passingMelodicSing2bHistory,
  passingSingleNoteHistory,
  passingThroughHarmonic2bHistory,
  passingThroughHarmonicId2aHistory,
  passingThroughHarmonicSing2aHistory,
  passingThroughMelodic2bHistory,
} from "../fixtures/attempts.ts"
import { mountHomeWithHistory, setUnlockAllSearch } from "./helpers/mount.ts"

function guidedPath() {
  return page.getByRole("region", { name: /^Guided path$/i })
}

test("fresh profile: current single-note is a link; next interval step is not", async () => {
  await mountHomeWithHistory([])
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Single note.*Sing back one note/i,
      }),
    )
    .toBeVisible()
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Intervals.*Melodic reproduction/i,
      }),
    )
    .not.toBeInTheDocument()
  await expect.element(page.getByRole("region", { name: /Level 1/i })).not.toBeInTheDocument()
  await expect
    .element(page.getByRole("region", { name: /Continue guided path/i }))
    .not.toBeInTheDocument()
})

test("after single-note complete: melodic 2a step is the current link", async () => {
  await mountHomeWithHistory(passingSingleNoteHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Intervals.*Melodic reproduction.*perfect 4th/i,
      }),
    )
    .toBeVisible()
  await expect
    .element(guidedPath().getByRole("link", { name: /Single note.*Complete/i }))
    .toBeVisible()
})

test("after interval 2a complete: scale-degree intro is the current link", async () => {
  await mountHomeWithHistory(passingLevel2History())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Scale degrees.*Melodic reproduction.*major key.*4th, 5th, octave/i,
      }),
    )
    .toBeVisible()
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Intervals.*Melodic reproduction.*diatonic intervals/i,
      }),
    )
    .not.toBeInTheDocument()
})

test("after intro scale degrees complete: melodic 2b step is the current link", async () => {
  await mountHomeWithHistory(passingIntroScaleDegreeHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Intervals.*Melodic reproduction.*diatonic intervals/i,
      }),
    )
    .toBeVisible()
})

test("after melodic 2b complete: harmonic sing at 2b is current; intro scale degrees passed", async () => {
  await mountHomeWithHistory(passingThroughMelodic2bHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Scale degrees.*Complete/i,
      }),
    )
    .toBeVisible()
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Intervals.*Harmonic reproduction.*diatonic intervals/i,
      }),
    )
    .toBeVisible()
})

test("after harmonic 2b complete: major diatonic scale degrees is the current link", async () => {
  await mountHomeWithHistory(passingThroughHarmonic2bHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Scale degrees.*Melodic reproduction.*diatonic degrees within one octave/i,
      }),
    )
    .toBeVisible()
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Chords.*Major triad.*root position.*Complete/i,
      }),
    )
    .toBeVisible()
})

test("after major diatonic scale degrees complete: minor diatonic is the current link", async () => {
  await mountHomeWithHistory(passingMajorDiatonicScaleDegreeHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Scale degrees.*Melodic reproduction.*natural minor key.*diatonic degrees within one octave/i,
      }),
    )
    .toBeVisible()
})

test("after harmonic sing 2a complete: chord major root is the current link", async () => {
  await mountHomeWithHistory(passingThroughHarmonicSing2aHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Chords.*Major triad.*root position/i,
      }),
    )
    .toBeVisible()
})

test("after harmonic identify 2a complete: chord minor root is the current link", async () => {
  await mountHomeWithHistory(passingThroughHarmonicId2aHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Chords.*Minor triad.*root position/i,
      }),
    )
    .toBeVisible()
})

test("after melodic sing 2b complete: chord major first is the current link", async () => {
  await mountHomeWithHistory(passingMelodicSing2bHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Chords.*Major triad.*1st inversion/i,
      }),
    )
    .toBeVisible()
})

test("after melodic 2b: current node is harmonic sing at 2b tier", async () => {
  await mountHomeWithHistory(passingThroughMelodic2bHistory())
  await expect
    .element(
      guidedPath().getByRole("link", {
        name: /Intervals.*Harmonic reproduction.*diatonic intervals/i,
      }),
    )
    .toBeVisible()
})

test("path complete: banner shown and stats link remains", async () => {
  await mountHomeWithHistory(passingFullGuidedPathHistory())
  await expect.element(guidedPath().getByText(/completed the guided path/i)).toBeVisible()
  await expect.element(page.getByRole("link", { name: /Your progress/i })).toBeVisible()
  await expect
    .element(guidedPath().getByRole("link", { name: /Single note.*Complete/i }))
    .toBeVisible()
})

describe("?unlock=all", () => {
  beforeEach(() => {
    setUnlockAllSearch(true)
  })

  afterEach(() => {
    setUnlockAllSearch(false)
  })

  test("fresh profile: scale-degree step is a link", async () => {
    await mountHomeWithHistory([])
    await expect
      .element(
        guidedPath().getByRole("link", {
          name: /Scale degrees.*major key.*4th, 5th, octave/i,
        }),
      )
      .toBeVisible()
  })

  test("fresh profile: single-note remains the current link", async () => {
    await mountHomeWithHistory([])
    await expect
      .element(
        guidedPath().getByRole("link", {
          name: /Single note.*Sing back one note/i,
        }),
      )
      .toBeVisible()
  })
})
