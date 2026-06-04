import {
  formatExerciseUrl,
  parseStepFromSearchParams,
} from "../curriculum/step-link.ts";
import { resolveAccessStep } from "../curriculum/session-step.ts";
import type { CurriculumStep } from "../curriculum/steps.ts";
import {
  getPredecessorStep,
  getUnlockRequirementForStep,
  isStepAccessible,
} from "../curriculum/unlock.ts";
import { getExercise, mountExercise } from "../exercises/registry.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import type { ExerciseId } from "../history/types.ts";

function getSearchString(deps: MountDeps): string {
  return deps.locationSearch ?? globalThis.location?.search ?? "";
}

function mountLockedStep(
  root: HTMLElement,
  step: CurriculumStep,
  requirement: NonNullable<ReturnType<typeof getUnlockRequirementForStep>>,
): void {
  const entry = getExercise(step.exerciseId);
  const predecessorStep = getPredecessorStep(step);
  if (!predecessorStep) {
    throw new Error(`Locked step missing predecessor: ${step.exerciseId}`);
  }
  const predecessorEntry = getExercise(predecessorStep.exerciseId);
  const predecessorName = requirement.predecessorLabel;
  const predecessorHref = formatExerciseUrl(
    predecessorEntry.route,
    predecessorStep,
  );

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
          Complete <strong>${predecessorName}</strong> first: answer at least
          ${requirement.minQuestions} questions with
          ${requirement.minPassRatePercent}% or higher question pass rate.
        </p>
        <a href="${predecessorHref}" class="test-card exercise-locked-cta">
          <span class="test-card-title">Go to ${predecessorName}</span>
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
  const search = getSearchString(deps);
  const urlStep = parseStepFromSearchParams(search, exerciseId);
  const accessStep = resolveAccessStep(exerciseId, records, urlStep);

  if (!isStepAccessible(accessStep, records, search)) {
    const requirement = getUnlockRequirementForStep(accessStep);
    if (!requirement) {
      throw new Error(`Locked step missing unlock requirement: ${exerciseId}`);
    }
    mountLockedStep(root, accessStep, requirement);
    return;
  }

  await mountExercise(root, exerciseId, {
    ...deps,
    sessionStep: accessStep,
  });
}
