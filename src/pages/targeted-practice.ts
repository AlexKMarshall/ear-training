import { mountTargetedPractice } from "../ui/targeted-practice-mount.tsx"
import "../ui/styles.css"

const root = document.querySelector<HTMLElement>("#app")
if (!root) {
  throw new Error("#app element not found")
}

void mountTargetedPractice(root)
