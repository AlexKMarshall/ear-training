import { createMemoryHistoryPort } from "../../../src/history/port.ts";
import type { AttemptRecord, ExerciseId } from "../../../src/history/types.ts";
import { mountExercisePage } from "../../../src/ui/exercise-page.ts";
import { mountHome } from "../../../src/ui/home.ts";
import { mountStats } from "../../../src/ui/stats.ts";
import "../../../src/ui/styles.css";

function createAppRoot(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("#app element not found");
  }
  return root;
}

export async function mountHomeWithHistory(
  records: AttemptRecord[],
): Promise<void> {
  const root = createAppRoot();
  await mountHome(root, { history: createMemoryHistoryPort(records) });
}

export async function mountExercisePageWithHistory(
  exerciseId: ExerciseId,
  records: AttemptRecord[],
): Promise<void> {
  const root = createAppRoot();
  await mountExercisePage(root, exerciseId, {
    history: createMemoryHistoryPort(records),
  });
}

export async function mountStatsWithHistory(
  records: AttemptRecord[],
): Promise<void> {
  const root = createAppRoot();
  await mountStats(root, { history: createMemoryHistoryPort(records) });
}
