import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { applyPlaywrightEnv } from "./playwright-env.mjs";

applyPlaywrightEnv();

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("playwright/cli.js");

const args = process.argv.includes("--with-deps")
  ? ["install", "--with-deps", "chromium"]
  : ["install", "chromium"];

const result = spawnSync(process.execPath, [playwrightCli, ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
