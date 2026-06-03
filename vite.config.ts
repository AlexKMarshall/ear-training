import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        singleNote: resolve(__dirname, "single-note/index.html"),
        chordMiddle: resolve(__dirname, "chord-middle/index.html"),
        stats: resolve(__dirname, "stats/index.html"),
      },
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
