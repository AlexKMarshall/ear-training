import {
  getUnlockRequirement,
  isExerciseUnlocked,
} from "../curriculum/unlock.ts";
import { getExercise, mountExercise } from "../exercises/registry.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import type { ExerciseId } from "../history/types.ts";

function mountLockedExercise(
  root: HTMLElement,
  exerciseId: ExerciseId,
): void {
  const entry = getExercise(exerciseId);
  const requirement = getUnlockRequirement(exerciseId);
  if (!requirement) {
    throw new Error(`Locked exercise missing unlock requirement: ${exerciseId}`);
  }
  const predecessor = getExercise(requirement.predecessorId);

  root.innerHTML = `
    <main class="app">
      <nav class="nav">
        <a href="/" class="nav-back">← All tests</a>
      </nav>

      <header class="header">
        <h1>${entry.title}</h1>
        <p class="subtitle">${entry.subtitle}</p>
      </header>

      <section class="exercise-locked" aria-labelledby="exercise-locked-heading">
        <h2 id="exercise-locked-heading" class="exercise-locked-title">Locked</h2>
        <p class="exercise-locked-desc">
          Complete <strong>${predecessor.title}</strong> first: answer at least
          ${requirement.minQuestions} questions with
          ${requirement.minPassRatePercent}% or higher question pass rate.
        </p>
        <a href="${predecessor.route}" class="test-card exercise-locked-cta">
          <span class="test-card-title">Go to ${predecessor.title}</span>
          <span class="test-card-desc">Continue the guided path</span>
        </a>
      </section>
    </main>
  `;
}

export async function mountExercisePage(
  root: HTMLElement,
  exerciseId: ExerciseId,
  deps: MountDeps = {},
): Promise<void> {
  const history = deps.history ?? createDefaultHistoryPort();
  const records = await history.getAllAttempts();
  if (!isExerciseUnlocked(exerciseId, records)) {
    mountLockedExercise(root, exerciseId);
    return;
  }
  mountExercise(root, exerciseId);
}
