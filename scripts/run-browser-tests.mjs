import { spawnSync } from "node:child_process";
import { applyPlaywrightEnv } from "./playwright-env.mjs";

applyPlaywrightEnv();

const vitestArgs = ["vitest", "run", "--project", "browser", ...process.argv.slice(2)];

const result = spawnSync("npx", vitestArgs, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
