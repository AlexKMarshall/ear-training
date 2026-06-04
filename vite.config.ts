/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { playwright } from "@vitest/browser-playwright";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        singleNote: resolve(__dirname, "single-note/index.html"),
        chordMiddle: resolve(__dirname, "chord-middle/index.html"),
        intervalMelodicSing: resolve(
          __dirname,
          "interval-melodic-sing/index.html",
        ),
        intervalHarmonicSing: resolve(
          __dirname,
          "interval-harmonic-sing/index.html",
        ),
        intervalMelodicId: resolve(
          __dirname,
          "interval-melodic-id/index.html",
        ),
        intervalHarmonicId: resolve(
          __dirname,
          "interval-harmonic-id/index.html",
        ),
        scaleDegreeSing: resolve(
          __dirname,
          "scale-degree-sing/index.html",
        ),
        stats: resolve(__dirname, "stats/index.html"),
      },
    },
  },
  test: {
    // vite-plugin-solid defaults test.environment to jsdom when unset; we use node
    // (unit) and Vitest browser mode (real Chromium via Playwright), not jsdom.
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          setupFiles: ["tests/vitest-unit-setup.ts"],
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/**/*.browser.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["tests/**/*.browser.test.ts"],
          // Real browser (Playwright); do not use jsdom/happy-dom for UI tests.
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
