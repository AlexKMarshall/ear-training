import { playChord } from "../audio/playback.ts"
import { buildInversionChoices } from "../chord-identify-choices.ts"
import { chordMidis } from "../chords.ts"
import {
  getChordInversionIdLessonBannerLabel,
  isChordInversionIdContentTierId,
} from "../curriculum/chord-tiers.ts"
import type { InversionId } from "../chord-inversions.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import {
  type ChordIdentifySessionDeps,
  prepareChordInversionIdExercise,
  resolveChordIdentifySession,
} from "./chord-identify-session.ts"
import {
  type IdentifyMountDeps,
  type IdentifyTestConfig,
  mountIdentifyTest,
} from "./identify-test.ts"

const chordInversionIdBase = {
  practiceModeId: "chord-inversion-id" as const,
  title: "Chords",
  subtitle: "Inversion identification · major triad",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  buildChoices: (exercise: LessonExercise) => {
    if (exercise.type !== "chord") {
      throw new Error("Missing chord for choices")
    }
    const eligibleIds = (exercise.eligibleTagIds ?? [exercise.inversionId]) as InversionId[]
    return buildInversionChoices(eligibleIds)
  },
  correctChoiceId: (exercise: LessonExercise) => {
    if (exercise.type !== "chord") {
      throw new Error("Missing chord for scoring")
    }
    return exercise.inversionId
  },
  status: {
    idle: "Press Play to hear the chord.",
    playing: "Listen to the chord…",
    ready: "Choose the inversion.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "chord") {
      throw new Error("Missing chord for playback")
    }
    return playChord(chordMidis(exercise.chord))
  },
}

export const chordInversionIdConfig: IdentifyTestConfig = {
  ...chordInversionIdBase,
  prepareExercise: () => prepareChordInversionIdExercise([]),
}

export function mountChordInversionIdTest(
  root: HTMLElement,
  deps?: ChordIdentifySessionDeps & IdentifyMountDeps,
): void {
  const { sessionHistory, planner, rng } = resolveChordIdentifySession(deps ?? {})
  const tierId = deps?.sessionCurriculumLesson?.contentTierId ?? "chord-inversion-major"
  const lessonBanner = isChordInversionIdContentTierId(tierId)
    ? getChordInversionIdLessonBannerLabel(tierId)
    : undefined

  mountIdentifyTest(
    root,
    {
      ...chordInversionIdBase,
      lessonBanner,
      prepareExercise: () =>
        prepareChordInversionIdExercise(
          sessionHistory.getRecords(),
          planner,
          undefined,
          rng,
          deps?.sessionCurriculumLesson,
        ),
    },
    { ...deps, history: sessionHistory.historyPort },
  )
}
