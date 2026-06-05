import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts";
import { getEligibleTagIds } from "../curriculum/curriculum-lessons.ts";
import { resolveSessionCurriculumLesson } from "../curriculum/session-step.ts";
import type { MountDeps } from "../history/port.ts";
import type { SessionHistoryCache } from "../history/session-cache.ts";
import type { AttemptRecord } from "../history/types.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import { getNaturalMinorSemitonesFromTonic, getScaleDegreeById } from "../scale-degree-config.ts";
import {
  buildScaleDegreeExercise,
  pickRandomLessonTonic,
  scaleDegreeToLessonExercise,
} from "../scale-degree-exercises.ts";
import { createDefaultSessionPlanner, type SessionPlanner } from "../session/planner.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";

export interface ScaleDegreeSessionDeps
  extends Pick<MountDeps, "sessionHistory" | "sessionCurriculumLesson"> {
  sessionPlanner?: SessionPlanner;
}

export interface ScaleDegreeExerciseResult {
  exercise: LessonExercise;
  lessonTonicMidi: number;
}

export function prepareScaleDegreeExercise(
  records: readonly AttemptRecord[],
  lessonTonicMidi: number | null,
  planner: SessionPlanner = createDefaultSessionPlanner(),
  range = getActiveNoteRange(),
  sessionCurriculumLesson?: CurriculumLesson,
): ScaleDegreeExerciseResult {
  const step = resolveSessionCurriculumLesson("scale-degree-sing", records, {
    urlCurriculumLesson: sessionCurriculumLesson,
  });
  const eligibleTagIds = getEligibleTagIds(step);
  const degrees = eligibleTagIds
    .map((id) => getScaleDegreeById(id))
    .filter((entry) => entry !== undefined);

  let tonic = lessonTonicMidi;
  if (tonic === null) {
    tonic = pickRandomLessonTonic(range, degrees);
  }

  const tagId = planner.planNextExerciseTag(step, records);
  const degree = getScaleDegreeById(tagId);
  if (!degree) {
    throw new Error(`Unknown scale degree id: ${tagId}`);
  }
  const semitonesFromTonic =
    step.contentTierId === "degree-minor-diatonic"
      ? getNaturalMinorSemitonesFromTonic(tagId)
      : degree.semitonesFromTonic;
  if (semitonesFromTonic === undefined) {
    throw new Error(`Unknown natural minor degree id: ${tagId}`);
  }

  return {
    exercise: {
      ...scaleDegreeToLessonExercise(
        buildScaleDegreeExercise(
          {
            ...degree,
            semitonesFromTonic,
          },
          tonic,
        ),
      ),
      contentTierId: step.contentTierId,
      eligibleTagIds,
    },
    lessonTonicMidi: tonic,
  };
}

export function resolveScaleDegreeSession(deps: ScaleDegreeSessionDeps): {
  sessionHistory: SessionHistoryCache;
  planner: SessionPlanner;
} {
  if (!deps.sessionHistory) {
    throw new Error("sessionHistory is required");
  }

  return {
    sessionHistory: deps.sessionHistory,
    planner: deps.sessionPlanner ?? createDefaultSessionPlanner(),
  };
}
