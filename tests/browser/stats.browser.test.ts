import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { mountStatsWithHistory } from "./helpers/mount.ts";

test("empty history shows no practice copy", async () => {
  await mountStatsWithHistory([]);
  await expect
    .element(page.getByText(/No practice history yet/i))
    .toBeVisible();
});
