import {
  formatLessonLinkUrl,
  parseCurriculumLessonFromSearchParams,
} from "../curriculum/lesson-link.ts";
import { resolveAccessCurriculumLesson } from "../curriculum/session-step.ts";
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts";
import {
  getPredecessorCurriculumLesson,
  getUnlockRequirementForCurriculumLesson,
  isCurriculumLessonAccessible,
} from "../curriculum/unlock.ts";
import { getPracticeMode, mountPracticeMode } from "../practice-modes/registry.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import type { PracticeModeId } from "../history/types.ts";

function getSearchString(deps: MountDeps): string {
  return deps.locationSearch ?? globalThis.location?.search ?? "";
}

function mountLockedCurriculumLesson(
  root: HTMLElement,
  step: CurriculumLesson,
  requirement: NonNullable<ReturnType<typeof getUnlockRequirementForCurriculumLesson>>,
): void {
  const entry = getPracticeMode(step.practiceModeId);
  const predecessorStep = getPredecessorCurriculumLesson(step);
  if (!predecessorStep) {
    throw new Error(`Locked step missing predecessor: ${step.practiceModeId}`);
  }
  const predecessorEntry = getPracticeMode(predecessorStep.practiceModeId);
  const predecessorName = requirement.predecessorLabel;
  const predecessorHref = formatLessonLinkUrl(
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
          ${requirement.minExercisesForUnlock} questions with
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

export async function mountPracticeModePage(
  root: HTMLElement,
  practiceModeId: PracticeModeId,
  deps: MountDeps = {},
): Promise<void> {
  const history = deps.history ?? createDefaultHistoryPort();
  const records = await history.getAllAttempts();
  const search = getSearchString(deps);
  const urlCurriculumLesson = parseCurriculumLessonFromSearchParams(search, practiceModeId);
  const accessStep = resolveAccessCurriculumLesson(practiceModeId, records, urlCurriculumLesson);

  if (!isCurriculumLessonAccessible(accessStep, records, search)) {
    const requirement = getUnlockRequirementForCurriculumLesson(accessStep);
    if (!requirement) {
      throw new Error(`Locked step missing unlock requirement: ${practiceModeId}`);
    }
    mountLockedCurriculumLesson(root, accessStep, requirement);
    return;
  }

  await mountPracticeMode(root, practiceModeId, {
    ...deps,
    sessionCurriculumLesson: accessStep,
  });
}
