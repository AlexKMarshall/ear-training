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
import { render } from "solid-js/web";
import { getPracticeMode, mountPracticeMode } from "../practice-modes/registry.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import { createSessionHistoryCache } from "../history/session-cache.ts";
import type { PracticeModeId } from "../history/types.ts";
import { LockedCurriculumLessonView } from "./exercise-locked-view.tsx";

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

  render(
    () =>
      LockedCurriculumLessonView({
        title: entry.title,
        subtitle: entry.subtitle,
        predecessorName,
        minExercisesForUnlock: requirement.minExercisesForUnlock,
        minPassRatePercent: requirement.minPassRatePercent,
        predecessorHref,
      }),
    root,
  );
}

export async function mountPracticeModePage(
  root: HTMLElement,
  practiceModeId: PracticeModeId,
  deps: MountDeps = {},
): Promise<void> {
  const port = deps.history ?? createDefaultHistoryPort();
  const sessionHistory =
    deps.sessionHistory ??
    createSessionHistoryCache(port, {
      initialRecords: await port.getAllAttempts(),
    });
  const records = sessionHistory.getRecords();
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
    sessionHistory,
    sessionCurriculumLesson: accessStep,
  });
}
