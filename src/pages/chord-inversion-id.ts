import { mountPracticeModePage } from "../ui/exercise-page.ts"
import "../ui/styles.css"

const root = document.querySelector<HTMLElement>("#app")
if (!root) {
  throw new Error("Missing #app root element")
}

void mountPracticeModePage(root, "chord-inversion-id")
