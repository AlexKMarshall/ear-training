import { playChord } from "../audio/playback.ts"
import { buildTriadQualityChoices } from "../chord-identify-choices.ts"
import { chordMidis } from "../chords.ts"
import {
  getChordQualityIdExerciseSubtitle,
  getChordQualityIdLessonBannerLabel,
  isChordQualityIdContentTierId,
} from "../curriculum/chord-tiers.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import {
  type ChordIdentifySessionDeps,
  prepareChordQualityIdExercise,
  resolveChordIdentifySession,
} from "./chord-identify-session.ts"
import {
  type IdentifyMountDeps,
  type IdentifyTestConfig,
  mountIdentifyTest,
} from "./identify-test.ts"

const chordQualityIdBase = {
  practiceModeId: "chord-quality-id" as const,
  title: "Chords",
  subtitle: "Quality identification · root position",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  buildChoices: (exercise: LessonExercise) => {
    if (exercise.type !== "chord") {
      throw new Error("Missing chord for choices")
    }
    const eligibleIds = exercise.eligibleTagIds ?? [exercise.chordTypeId]
    return buildTriadQualityChoices(eligibleIds)
  },
  correctChoiceId: (exercise: LessonExercise) => {
    if (exercise.type !== "chord") {
      throw new Error("Missing chord for scoring")
    }
    return exercise.chordTypeId
  },
  status: {
    idle: "Press Play to hear the chord.",
    playing: "Listen to the chord…",
    ready: "Choose major or minor.",
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

export const chordQualityIdConfig: IdentifyTestConfig = {
  ...chordQualityIdBase,
  prepareExercise: () => prepareChordQualityIdExercise([]),
}

export function mountChordQualityIdTest(
  root: HTMLElement,
  deps?: ChordIdentifySessionDeps & IdentifyMountDeps,
): void {
  const { sessionHistory, planner, rng } = resolveChordIdentifySession(deps ?? {})
  const tierId = deps?.sessionCurriculumLesson?.contentTierId ?? "chord-quality-root"
  const lessonBanner = isChordQualityIdContentTierId(tierId)
    ? getChordQualityIdLessonBannerLabel(tierId)
    : undefined
  const subtitle = isChordQualityIdContentTierId(tierId)
    ? getChordQualityIdExerciseSubtitle(tierId)
    : chordQualityIdBase.subtitle

  mountIdentifyTest(
    root,
    {
      ...chordQualityIdBase,
      subtitle,
      lessonBanner,
      prepareExercise: () =>
        prepareChordQualityIdExercise(
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
