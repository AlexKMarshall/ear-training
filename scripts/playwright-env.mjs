/** Project-local Playwright browsers (under node_modules), not a global/cache path. */
export const PLAYWRIGHT_BROWSERS_PATH = "0";

export function applyPlaywrightEnv() {
  process.env.PLAYWRIGHT_BROWSERS_PATH = PLAYWRIGHT_BROWSERS_PATH;
}
