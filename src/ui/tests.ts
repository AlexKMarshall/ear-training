import { playChord, playTargetNote } from "../audio/playback.ts"
import { chordMidis } from "../chords.ts"
import { getChordLessonBannerLabel, isChordContentTierId } from "../curriculum/chord-tiers.ts"
import type { SingExerciseDefinition } from "../exercise-definition.ts"
import type { MountDeps } from "../history/port.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import { randomNoteInRange } from "../notes.ts"
import { getActiveNoteRange } from "../voice-ranges.ts"
import { exercisePromptForVoicingPosition } from "../voicing-position.ts"
import {
  type ChordSessionDeps,
  prepareChordExercise,
  resolveChordSession,
} from "./chord-session.ts"
import { type ExerciseMountDeps, mountExercise } from "./mount-exercise.ts"
import { scoreSingFromSamples } from "./sing-scoring.ts"

const singleNoteStatus = {
  idle: "Press Play to hear the reference note.",
  playing: "Listen…",
  ready: "Sing the note you heard, then tap Start singing when ready.",
  recording:
    "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
  pass: "Correct — tap Next exercise when you are ready.",
  fail: "Try again on this exercise (up to 3 tries).",
  failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
} as const

export const singleNoteExerciseDefinition: SingExerciseDefinition = {
  practiceModeId: "single-note",
  responseMode: "sing",
  title: "Sing a single note",
  subtitle: "Sing back the note you hear",
  playButtonLabel: "Play note",
  showVoicePicker: true,
  status: singleNoteStatus,
  prepareExercise: () => ({
    type: "single-note",
    target: randomNoteInRange(getActiveNoteRange()),
  }),
  playReference: (exercise) => playTargetNote(exercise.target.midi),
  scoreAnswer: scoreSingFromSamples,
}

const chordSingStatus = {
  idle: "Press Play to hear the chord.",
  playing: "Listen to the chord…",
  ready: "Sing the prompted voice, then tap Start singing when ready.",
  recording:
    "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
  pass: "Correct — tap Next exercise when you are ready.",
  fail: "Try again on this exercise (up to 3 tries).",
  failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
} as const

const chordSingBase = {
  practiceModeId: "chord-sing" as const,
  title: "Sing chord voices",
  subtitle: "Hear a triad and sing the prompted voice",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  exercisePromptFromDraw: true,
  exercisePrompt: (exercise: LessonExercise) => {
    if (exercise.type !== "chord" || exercise.voicingPositionId === undefined) {
      throw new Error("Missing voicing position for chord exercise")
    }
    return exercisePromptForVoicingPosition(exercise.voicingPositionId)
  },
  status: chordSingStatus,
  playReference: (exercise: LessonExercise) => {
    if (exercise.type !== "chord") {
      throw new Error("Missing chord for playback")
    }
    return playChord(chordMidis(exercise.chord))
  },
}

export const chordSingExerciseDefinition: SingExerciseDefinition = {
  ...chordSingBase,
  responseMode: "sing",
  scoreAnswer: scoreSingFromSamples,
  prepareExercise: () => prepareChordExercise([]),
}

export function mountSingleNoteTest(root: HTMLElement, deps?: MountDeps & ExerciseMountDeps): void {
  mountExercise(root, singleNoteExerciseDefinition, deps)
}

export function mountChordSingTest(
  root: HTMLElement,
  deps?: ChordSessionDeps & ExerciseMountDeps,
): void {
  const { sessionHistory, planner, rng } = resolveChordSession(deps ?? {})
  const tierId = deps?.sessionCurriculumLesson?.contentTierId ?? "chord-major-root"
  const lessonBanner = isChordContentTierId(tierId) ? getChordLessonBannerLabel(tierId) : undefined

  mountExercise(
    root,
    {
      ...chordSingExerciseDefinition,
      lessonBanner,
      prepareExercise: () =>
        prepareChordExercise(
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
