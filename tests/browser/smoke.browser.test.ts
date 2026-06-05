import { expect, test } from "vitest"
import { page } from "vitest/browser"
import { mountHome } from "../../src/ui/home.tsx"
import "../../src/ui/styles.css"

test("mountHome renders heading and first exercise link", async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.querySelector<HTMLElement>("#app")
  if (!root) {
    throw new Error("#app element not found")
  }

  await mountHome(root)

  await expect.element(page.getByRole("heading", { name: /Ear Training/i })).toBeVisible()
  await expect
    .element(
      page
        .getByRole("region", { name: /^Guided path$/i })
        .getByRole("link", { name: /Single note/i }),
    )
    .toBeVisible()
})
