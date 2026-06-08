import { beforeEach, expect, test } from "vitest"
import { page } from "vitest/browser"
import { mountPracticeModeInBrowser } from "./helpers/mount.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})

test("named-interval sing shows interval label before play", async () => {
  mountPracticeModeInBrowser("interval-named-sing", {
    samplesHz: Array(20).fill(392),
  })

  await expect.element(page.getByRole("heading", { name: /Sing named intervals/i })).toBeVisible()
  await expect.element(page.getByText("Perfect 5th")).toBeVisible()
})
