import { resolve } from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/**/*.browser.test.ts"],
        },
      },
      {
        test: {
          name: "browser",
          include: ["tests/**/*.browser.test.ts"],
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
