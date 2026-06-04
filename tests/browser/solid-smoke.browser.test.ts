import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { mountSolidSmoke } from "../../src/ui/solid-smoke.tsx";

test("Solid smoke renders accessible status text", async () => {
  document.body.innerHTML = '<div id="solid-smoke-root"></div>';
  const root = document.querySelector<HTMLElement>("#solid-smoke-root");
  if (!root) {
    throw new Error("#solid-smoke-root element not found");
  }

  mountSolidSmoke(root);

  await expect
    .element(page.getByRole("status"))
    .toBeVisible();
  await expect
    .element(page.getByText("Solid toolchain ready", { exact: true }))
    .toBeVisible();
});
