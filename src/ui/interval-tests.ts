import { playDyad, playMelodicSequence, playTargetNote } from "../audio/playback.ts"
import type { SingExerciseDefinition } from "../exercise-definition.ts"
import type { PracticeModeId } from "../history/types.ts"
import { getIntervalById } from "../interval-config.ts"
import { buildIntervalChoices } from "../interval-exercises.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import {
  type IdentifyMountDeps,
  type IdentifyTestConfig,
  mountIdentifyTest,
} from "./identify-test.ts"
import {
  type IntervalSessionDeps,
  prepareIntervalExercise,
  resolveIntervalSession,
} from "./interval-session.ts"
import { mountExercise } from "./mount-exercise.ts"
import { scoreSingFromSamples } from "./sing-scoring.ts"
import type { SingMountDeps, SingTestConfig } from "./sing-test.ts"

function intervalIdentifyChoiceHelpers() {
  return {
    buildChoices: (exercise: LessonExercise) => {
      if (exercise.type !== "interval") {
        throw new Error("Missing interval for choices")
      }
      const eligibleIds = exercise.eligibleTagIds ?? [exercise.intervalId]
      return buildIntervalChoices(exercise.intervalId, eligibleIds)
    },
    correctChoiceId: (exercise: LessonExercise) => {
      if (exercise.type !== "interval") {
        throw new Error("Missing interval for scoring")
      }
      return exercise.intervalId
    },
    failRetryDetail: "That wasn't right — tap Try again to hear the interval and pick again.",
  }
}

const intervalMelodicSingStatus = {
  idle: "Press Play to hear the interval.",
  playing: "Listen to both notes…",
  ready: "Sing the top note of the interval, then tap Start singing when ready.",
  recording:
    "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
  pass: "Correct — tap Next exercise when you are ready.",
  fail: "Try again on this exercise (up to 3 tries).",
  failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
} as const

const intervalMelodicSingBase = {
  practiceModeId: "interval-melodic-sing" as const,
  title: "Sing melodic intervals",
  subtitle: "Hear two notes in sequence, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  status: intervalMelodicSingStatus,
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "interval") {
      throw new Error("Missing interval for playback")
    }
    const { lower, upper } = exercise.interval
    return playMelodicSequence([lower.midi, upper.midi])
  },
}

export const intervalMelodicSingExerciseDefinition: SingExerciseDefinition = {
  ...intervalMelodicSingBase,
  responseMode: "sing",
  scoreAnswer: scoreSingFromSamples,
  prepareExercise: () => prepareIntervalExercise("interval-melodic-sing", "melodic", []),
}

export const intervalMelodicSingConfig: SingTestConfig = {
  practiceModeId: intervalMelodicSingExerciseDefinition.practiceModeId,
  title: intervalMelodicSingExerciseDefinition.title,
  subtitle: intervalMelodicSingExerciseDefinition.subtitle,
  playButtonLabel: intervalMelodicSingExerciseDefinition.playButtonLabel,
  showVoicePicker: intervalMelodicSingExerciseDefinition.showVoicePicker,
  status: {
    ...intervalMelodicSingExerciseDefinition.status,
    recording: intervalMelodicSingStatus.recording,
  },
  prepareExercise: intervalMelodicSingExerciseDefinition.prepareExercise,
  playReference: intervalMelodicSingExerciseDefinition.playReference,
}

const intervalHarmonicSingStatus = {
  idle: "Press Play to hear the interval.",
  playing: "Listen to both notes…",
  ready: "Sing the top note of the interval, then tap Start singing when ready.",
  recording:
    "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
  pass: "Correct — tap Next exercise when you are ready.",
  fail: "Try again on this exercise (up to 3 tries).",
  failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
} as const

const intervalHarmonicSingBase = {
  practiceModeId: "interval-harmonic-sing" as const,
  title: "Sing harmonic intervals",
  subtitle: "Hear two notes together, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  status: intervalHarmonicSingStatus,
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "interval") {
      throw new Error("Missing interval for playback")
    }
    const { lower, upper } = exercise.interval
    return playDyad([lower.midi, upper.midi])
  },
}

export const intervalHarmonicSingExerciseDefinition: SingExerciseDefinition = {
  ...intervalHarmonicSingBase,
  responseMode: "sing",
  scoreAnswer: scoreSingFromSamples,
  prepareExercise: () => prepareIntervalExercise("interval-harmonic-sing", "harmonic", []),
}

export const intervalHarmonicSingConfig: SingTestConfig = {
  practiceModeId: intervalHarmonicSingExerciseDefinition.practiceModeId,
  title: intervalHarmonicSingExerciseDefinition.title,
  subtitle: intervalHarmonicSingExerciseDefinition.subtitle,
  playButtonLabel: intervalHarmonicSingExerciseDefinition.playButtonLabel,
  showVoicePicker: intervalHarmonicSingExerciseDefinition.showVoicePicker,
  status: {
    ...intervalHarmonicSingExerciseDefinition.status,
    recording: intervalHarmonicSingStatus.recording,
  },
  prepareExercise: intervalHarmonicSingExerciseDefinition.prepareExercise,
  playReference: intervalHarmonicSingExerciseDefinition.playReference,
}

function mountIntervalSingTest(
  root: HTMLElement,
  practiceModeId: Extract<PracticeModeId, "interval-melodic-sing" | "interval-harmonic-sing">,
  presentation: "melodic" | "harmonic",
  definition: SingExerciseDefinition,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  const { sessionHistory, planner } = resolveIntervalSession(deps ?? {})
  mountExercise(
    root,
    {
      ...definition,
      prepareExercise: () =>
        prepareIntervalExercise(
          practiceModeId,
          presentation,
          sessionHistory.getRecords(),
          planner,
          undefined,
          deps?.sessionCurriculumLesson,
        ),
    },
    { ...deps, history: sessionHistory.historyPort },
  )
}

const intervalNamedSingStatus = {
  idle: "Press Play to hear the reference note.",
  playing: "Listen to the reference note…",
  ready: "Sing the interval shown below, then tap Start singing when ready.",
  recording:
    "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
  pass: "Correct — tap Next exercise when you are ready.",
  fail: "Try again on this exercise (up to 3 tries).",
  failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
} as const

const intervalNamedSingBase = {
  practiceModeId: "interval-named-sing" as const,
  title: "Sing named intervals",
  subtitle: "Hear one note, then sing the named interval above it",
  playButtonLabel: "Play note",
  showVoicePicker: true,
  exercisePromptFromDraw: true,
  status: intervalNamedSingStatus,
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "interval") {
      throw new Error("Missing interval for playback")
    }
    return playTargetNote(exercise.interval.lower.midi)
  },
  exercisePrompt: (exercise: LessonExercise) => {
    if (exercise.type !== "interval") {
      throw new Error("Missing interval for prompt")
    }
    const label = getIntervalById(exercise.intervalId)?.label ?? exercise.intervalId
    return label
  },
}

export const intervalNamedSingExerciseDefinition: SingExerciseDefinition = {
  ...intervalNamedSingBase,
  responseMode: "sing",
  scoreAnswer: scoreSingFromSamples,
  prepareExercise: () => prepareIntervalExercise("interval-named-sing", "melodic", []),
}

export const intervalNamedSingConfig: SingTestConfig = {
  practiceModeId: intervalNamedSingExerciseDefinition.practiceModeId,
  title: intervalNamedSingExerciseDefinition.title,
  subtitle: intervalNamedSingExerciseDefinition.subtitle,
  playButtonLabel: intervalNamedSingExerciseDefinition.playButtonLabel,
  showVoicePicker: intervalNamedSingExerciseDefinition.showVoicePicker,
  exercisePromptFromDraw: intervalNamedSingExerciseDefinition.exercisePromptFromDraw,
  exercisePrompt: intervalNamedSingExerciseDefinition.exercisePrompt,
  status: {
    ...intervalNamedSingExerciseDefinition.status,
    recording: intervalNamedSingStatus.recording,
  },
  prepareExercise: intervalNamedSingExerciseDefinition.prepareExercise,
  playReference: intervalNamedSingExerciseDefinition.playReference,
}

export function mountIntervalMelodicSingTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  mountIntervalSingTest(
    root,
    "interval-melodic-sing",
    "melodic",
    intervalMelodicSingExerciseDefinition,
    deps,
  )
}

export function mountIntervalNamedSingTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  const { sessionHistory, planner } = resolveIntervalSession(deps ?? {})
  mountExercise(
    root,
    {
      ...intervalNamedSingExerciseDefinition,
      prepareExercise: () =>
        prepareIntervalExercise(
          "interval-named-sing",
          "melodic",
          sessionHistory.getRecords(),
          planner,
          undefined,
          deps?.sessionCurriculumLesson,
        ),
    },
    { ...deps, history: sessionHistory.historyPort },
  )
}

export function mountIntervalHarmonicSingTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  mountIntervalSingTest(
    root,
    "interval-harmonic-sing",
    "harmonic",
    intervalHarmonicSingExerciseDefinition,
    deps,
  )
}

const intervalMelodicIdBase = {
  practiceModeId: "interval-melodic-id" as const,
  title: "Identify melodic intervals",
  subtitle: "Hear two notes in sequence, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  ...intervalIdentifyChoiceHelpers(),
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "interval") throw new Error("Missing interval for playback")
    const { lower, upper } = exercise.interval
    return playMelodicSequence([lower.midi, upper.midi])
  },
}

export const intervalMelodicIdConfig: IdentifyTestConfig = {
  ...intervalMelodicIdBase,
  prepareExercise: () => prepareIntervalExercise("interval-melodic-id", "melodic", []),
}

const intervalHarmonicIdBase = {
  practiceModeId: "interval-harmonic-id" as const,
  title: "Identify harmonic intervals",
  subtitle: "Hear two notes together, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  ...intervalIdentifyChoiceHelpers(),
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "interval") throw new Error("Missing interval for playback")
    const { lower, upper } = exercise.interval
    return playDyad([lower.midi, upper.midi])
  },
}

export const intervalHarmonicIdConfig: IdentifyTestConfig = {
  ...intervalHarmonicIdBase,
  prepareExercise: () => prepareIntervalExercise("interval-harmonic-id", "harmonic", []),
}

function mountIntervalIdentifyTest(
  root: HTMLElement,
  practiceModeId: Extract<PracticeModeId, "interval-melodic-id" | "interval-harmonic-id">,
  presentation: "melodic" | "harmonic",
  base: Omit<IdentifyTestConfig, "prepareExercise">,
  deps?: IntervalSessionDeps & IdentifyMountDeps,
): void {
  const { sessionHistory, planner } = resolveIntervalSession(deps ?? {})
  mountIdentifyTest(
    root,
    {
      ...base,
      prepareExercise: () =>
        prepareIntervalExercise(
          practiceModeId,
          presentation,
          sessionHistory.getRecords(),
          planner,
          undefined,
          deps?.sessionCurriculumLesson,
        ),
    },
    { ...deps, history: sessionHistory.historyPort },
  )
}

export function mountIntervalMelodicIdTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & IdentifyMountDeps,
): void {
  mountIntervalIdentifyTest(root, "interval-melodic-id", "melodic", intervalMelodicIdBase, deps)
}

export function mountIntervalHarmonicIdTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & IdentifyMountDeps,
): void {
  mountIntervalIdentifyTest(root, "interval-harmonic-id", "harmonic", intervalHarmonicIdBase, deps)
}
