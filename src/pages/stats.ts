import { mountStats } from "../ui/stats.ts";
import "../ui/styles.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("#app element not found");
}

void mountStats(root);
