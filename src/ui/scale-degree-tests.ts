import { playTargetNote } from "../audio/playback.ts"
import { getScaleDegreeKeyQualityLabel } from "../curriculum/scale-degree-tiers.ts"
import type { SingExerciseDefinition } from "../exercise-definition.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import { getScaleDegreeById } from "../scale-degree-config.ts"
import { type ExerciseMountDeps, mountExercise } from "./mount-exercise.ts"
import {
  prepareScaleDegreeExercise,
  resolveScaleDegreeSession,
  type ScaleDegreeSessionDeps,
} from "./scale-degree-session.ts"
import { scoreSingFromSamples } from "./sing-scoring.ts"

const scaleDegreeSingStatus = {
  idle: "Press Play to hear the tonic for this lesson.",
  playing: "Listen to the tonic…",
  ready: "Sing the degree shown below, then tap Start singing when ready.",
  recording:
    "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
  pass: "Correct — tap Next exercise when you are ready.",
  fail: "Try again on this exercise (up to 3 tries).",
  failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
} as const

const scaleDegreeSingBase = {
  practiceModeId: "scale-degree-sing" as const,
  title: "Sing scale degrees",
  subtitle: "One key per lesson — hear the tonic, then sing each requested scale degree",
  playButtonLabel: "Play tonic",
  showVoicePicker: true,
  status: scaleDegreeSingStatus,
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "scale-degree") {
      throw new Error("Missing scale degree for playback")
    }
    return playTargetNote(exercise.scaleDegree.tonic.midi)
  },
  exercisePrompt: (exercise: LessonExercise) => {
    if (exercise.type !== "scale-degree") {
      throw new Error("Missing scale degree for prompt")
    }
    const label = getScaleDegreeById(exercise.degreeId)?.label ?? exercise.degreeId
    return `Sing the ${label}`
  },
}

export const scaleDegreeSingExerciseDefinition: SingExerciseDefinition = {
  ...scaleDegreeSingBase,
  responseMode: "sing",
  scoreAnswer: scoreSingFromSamples,
  prepareExercise: () => prepareScaleDegreeExercise([], null).exercise,
}

export function mountScaleDegreeSingTest(
  root: HTMLElement,
  deps?: ScaleDegreeSessionDeps & ExerciseMountDeps,
): void {
  const { sessionHistory, planner } = resolveScaleDegreeSession(deps ?? {})
  let lessonTonicMidi: number | null = null
  const lessonBanner =
    getScaleDegreeKeyQualityLabel(
      deps?.sessionCurriculumLesson?.contentTierId ?? "degree-major-intro",
    ) ?? undefined

  mountExercise(
    root,
    {
      ...scaleDegreeSingExerciseDefinition,
      lessonBanner,
      onLessonReset: () => {
        lessonTonicMidi = null
      },
      prepareExercise: () => {
        const result = prepareScaleDegreeExercise(
          sessionHistory.getRecords(),
          lessonTonicMidi,
          planner,
          undefined,
          deps?.sessionCurriculumLesson,
        )
        lessonTonicMidi = result.lessonTonicMidi
        return result.exercise
      },
    },
    { ...deps, history: sessionHistory.historyPort },
  )
}
