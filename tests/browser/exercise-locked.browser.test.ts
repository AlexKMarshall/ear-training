import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { page } from "vitest/browser"
import { formatLessonLinkUrl } from "../../src/curriculum/lesson-link.ts"
import { getPredecessorCurriculumLesson } from "../../src/curriculum/unlock.ts"
import { getPracticeMode } from "../../src/practice-modes/registry.ts"
import { passingSingleNoteHistory } from "../fixtures/attempts.ts"
import {
  mountPracticeModePageWithHistory,
  setCurriculumLessonSearch,
  setUnlockAllSearch,
} from "./helpers/mount.ts"

test("locked default step shows predecessor curriculum label and lesson link", async () => {
  await mountPracticeModePageWithHistory("interval-melodic-sing", [])
  const predecessor = getPredecessorCurriculumLesson({
    practiceModeId: "interval-melodic-sing",
    contentTierId: "interval-2a",
  })!
  const expectedHref = formatLessonLinkUrl(
    getPracticeMode(predecessor.practiceModeId).route,
    predecessor,
  )

  await expect.element(page.getByRole("heading", { name: "Locked" })).toBeVisible()
  const cta = page.getByRole("link", { name: /Go to Sing a single note/i })
  await expect.element(cta).toBeVisible()
  await expect.element(cta).toHaveAttribute("href", expectedHref)
})

test("unlocked default step mounts the exercise", async () => {
  await mountPracticeModePageWithHistory("interval-melodic-sing", passingSingleNoteHistory())
  await expect.element(page.getByRole("heading", { name: "Locked" })).not.toBeInTheDocument()
  await expect.element(page.getByRole("heading", { name: /Sing melodic intervals/i })).toBeVisible()
})

test("locked deep link shows predecessor step label and lesson link CTA", async () => {
  setCurriculumLessonSearch({
    practiceModeId: "interval-melodic-sing",
    contentTierId: "interval-2b",
  })
  const lockedStep = {
    practiceModeId: "interval-melodic-sing" as const,
    contentTierId: "interval-2b" as const,
  }
  const predecessor = getPredecessorCurriculumLesson(lockedStep)!
  const expectedHref = formatLessonLinkUrl(
    getPracticeMode(predecessor.practiceModeId).route,
    predecessor,
  )

  await mountPracticeModePageWithHistory("interval-melodic-sing", passingSingleNoteHistory(), {
    locationSearch: window.location.search,
  })

  await expect.element(page.getByRole("heading", { name: "Locked" })).toBeVisible()
  const cta = page.getByRole("link", {
    name: /Go to Sing scale degrees \(major key · 4th, 5th, octave\)/i,
  })
  await expect.element(cta).toBeVisible()
  await expect.element(cta).toHaveAttribute("href", expectedHref)
  setCurriculumLessonSearch(null)
})

test("locked scale-degree default step uses predecessor lesson link", async () => {
  const lockedStep = {
    practiceModeId: "scale-degree-sing" as const,
    contentTierId: "degree-major-intro" as const,
  }
  const predecessor = getPredecessorCurriculumLesson(lockedStep)!
  const expectedHref = formatLessonLinkUrl(
    getPracticeMode(predecessor.practiceModeId).route,
    predecessor,
  )

  await mountPracticeModePageWithHistory("scale-degree-sing", [])
  await expect.element(page.getByRole("heading", { name: "Locked" })).toBeVisible()
  const cta = page.getByRole("link", {
    name: /Go to Identify harmonic intervals \(perfect 4th, 5th, octave\)/i,
  })
  await expect.element(cta).toHaveAttribute("href", expectedHref)
})

test("unlocked step deep link mounts the exercise", async () => {
  setCurriculumLessonSearch({
    practiceModeId: "interval-melodic-sing",
    contentTierId: "interval-2a",
  })
  await mountPracticeModePageWithHistory("interval-melodic-sing", passingSingleNoteHistory(), {
    locationSearch: window.location.search,
  })
  await expect.element(page.getByRole("heading", { name: /Sing melodic intervals/i })).toBeVisible()
  await expect.element(page.getByRole("heading", { name: "Locked" })).not.toBeInTheDocument()
  setCurriculumLessonSearch(null)
})

describe("?unlock=all", () => {
  beforeEach(() => {
    setUnlockAllSearch(true)
  })

  afterEach(() => {
    setUnlockAllSearch(false)
  })

  test("locked step URL mounts exercise without faking progress", async () => {
    setCurriculumLessonSearch(
      {
        practiceModeId: "scale-degree-sing",
        contentTierId: "degree-major-intro",
      },
      { unlockAll: true },
    )
    await mountPracticeModePageWithHistory("scale-degree-sing", [], {
      locationSearch: window.location.search,
    })
    await expect.element(page.getByRole("heading", { name: /Sing scale degrees/i })).toBeVisible()
    await expect.element(page.getByRole("heading", { name: "Locked" })).not.toBeInTheDocument()
    setCurriculumLessonSearch(null)
  })
})
