import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyPlaywrightEnv } from "./playwright-env.mjs";

applyPlaywrightEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const binName = process.platform === "win32" ? "playwright.cmd" : "playwright";
const playwrightBin = join(root, "node_modules", ".bin", binName);

if (!existsSync(playwrightBin)) {
  console.error(
    "playwright CLI not found; ensure devDependencies are installed (npm ci).",
  );
  process.exit(1);
}

const args = process.argv.includes("--with-deps")
  ? ["install", "--with-deps", "chromium"]
  : ["install", "chromium"];

const result = spawnSync(playwrightBin, args, {
  stdio: "inherit",
  env: process.env,
  cwd: root,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
