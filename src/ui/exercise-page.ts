import { parseStepFromSearchParams } from "../curriculum/step-link.ts";
import {
  getUnlockRequirement,
  getUnlockRequirementForStep,
  isExerciseUnlocked,
  isStepAccessible,
} from "../curriculum/unlock.ts";
import type { CurriculumStep } from "../curriculum/steps.ts";
import { getExercise, mountExercise } from "../exercises/registry.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import type { ExerciseId } from "../history/types.ts";

function getSearchString(deps: MountDeps): string {
  return deps.locationSearch ?? globalThis.location?.search ?? "";
}

function mountLockedExercise(
  root: HTMLElement,
  exerciseId: ExerciseId,
  requirement: NonNullable<ReturnType<typeof getUnlockRequirement>>,
): void {
  const entry = getExercise(exerciseId);
  const predecessor = getExercise(requirement.predecessorId);
  const predecessorName = requirement.predecessorLabel;

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
        <a href="${predecessor.route}" class="test-card exercise-locked-cta">
          <span class="test-card-title">Go to ${predecessor.title}</span>
          <span class="test-card-desc">Continue the guided path</span>
        </a>
      </section>
    </main>
  `;
}

function mountLockedStep(
  root: HTMLElement,
  step: CurriculumStep,
  requirement: NonNullable<ReturnType<typeof getUnlockRequirementForStep>>,
): void {
  const entry = getExercise(step.exerciseId);
  const predecessor = getExercise(requirement.predecessorId);
  const predecessorName = requirement.predecessorLabel;

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
  const search = getSearchString(deps);
  const urlStep = parseStepFromSearchParams(search, exerciseId);

  if (urlStep) {
    if (!isStepAccessible(urlStep, records, search)) {
      const requirement = getUnlockRequirementForStep(urlStep);
      if (!requirement) {
        throw new Error(`Locked step missing unlock requirement: ${exerciseId}`);
      }
      mountLockedStep(root, urlStep, requirement);
      return;
    }
    await mountExercise(root, exerciseId, {
      ...deps,
      sessionStep: urlStep,
    });
    return;
  }

  if (!isExerciseUnlocked(exerciseId, records)) {
    const requirement = getUnlockRequirement(exerciseId);
    if (!requirement) {
      throw new Error(`Locked exercise missing unlock requirement: ${exerciseId}`);
    }
    mountLockedExercise(root, exerciseId, requirement);
    return;
  }

  await mountExercise(root, exerciseId, deps);
}
