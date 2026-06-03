import { mountExercisePage } from "../ui/exercise-page.ts";
import "../ui/styles.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("#app element not found");
}

void mountExercisePage(root, "chord-middle");
