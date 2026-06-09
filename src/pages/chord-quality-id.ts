import { mountPracticeModePage } from "../ui/exercise-page.ts"

const root = document.querySelector<HTMLElement>("#app")
if (!root) {
  throw new Error("#app element not found")
}

void mountPracticeModePage(root, "chord-quality-id")
