import { mountIntervalHarmonicSingTest } from "../ui/interval-tests.ts";
import "../ui/styles.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("#app element not found");
}

mountIntervalHarmonicSingTest(root);
