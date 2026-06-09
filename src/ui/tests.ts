import { playChord, playTargetNote } from "../audio/playback.ts"
import { chordMidis } from "../chords.ts"
import { getChordLessonBannerLabel, isChordContentTierId } from "../curriculum/chord-tiers.ts"
import type { SingExerciseDefinition } from "../exercise-definition.ts"
import type { MountDeps } from "../history/port.ts"
import { randomNoteInRange } from "../notes.ts"
import { getActiveNoteRange } from "../voice-ranges.ts"
import { exercisePromptForVoicingPosition } from "../voicing-position.ts"
import {
  type ChordSessionDeps,
  prepareChordExercise,
  resolveChordSession,
} from "./chord-session.ts"
import { mountExercise } from "./mount-exercise.ts"
import { scoreSingFromSamples } from "./sing-scoring.ts"
import type { SingMountDeps, SingTestConfig } from "./sing-test.ts"

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

export const singleNoteTestConfig: SingTestConfig = {
  practiceModeId: singleNoteExerciseDefinition.practiceModeId,
  title: singleNoteExerciseDefinition.title,
  subtitle: singleNoteExerciseDefinition.subtitle,
  playButtonLabel: singleNoteExerciseDefinition.playButtonLabel,
  showVoicePicker: singleNoteExerciseDefinition.showVoicePicker,
  status: { ...singleNoteExerciseDefinition.status, recording: singleNoteStatus.recording },
  prepareExercise: singleNoteExerciseDefinition.prepareExercise,
  playReference: singleNoteExerciseDefinition.playReference,
}

const chordSingBase = {
  practiceModeId: "chord-sing" as const,
  title: "Sing chord voices",
  subtitle: "Hear a triad and sing the prompted voice",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  exercisePromptFromDraw: true,
  exercisePrompt: (exercise: Parameters<NonNullable<SingTestConfig["exercisePrompt"]>>[0]) => {
    if (exercise.type !== "chord" || exercise.voicingPositionId === undefined) {
      throw new Error("Missing voicing position for chord exercise")
    }
    return exercisePromptForVoicingPosition(exercise.voicingPositionId)
  },
  status: {
    idle: "Press Play to hear the chord.",
    playing: "Listen to the chord…",
    ready: "Sing the prompted voice, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: Parameters<SingTestConfig["playReference"]>[0]) => {
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

export const chordSingTestConfig: SingTestConfig = {
  practiceModeId: chordSingExerciseDefinition.practiceModeId,
  title: chordSingExerciseDefinition.title,
  subtitle: chordSingExerciseDefinition.subtitle,
  playButtonLabel: chordSingExerciseDefinition.playButtonLabel,
  showVoicePicker: chordSingExerciseDefinition.showVoicePicker,
  exercisePromptFromDraw: chordSingExerciseDefinition.exercisePromptFromDraw,
  exercisePrompt: chordSingExerciseDefinition.exercisePrompt,
  status: {
    ...chordSingExerciseDefinition.status,
    recording: chordSingExerciseDefinition.status.recording!,
  },
  prepareExercise: chordSingExerciseDefinition.prepareExercise,
  playReference: chordSingExerciseDefinition.playReference,
}

export function mountSingleNoteTest(root: HTMLElement, deps?: MountDeps & SingMountDeps): void {
  mountExercise(root, singleNoteExerciseDefinition, deps)
}

export function mountChordSingTest(
  root: HTMLElement,
  deps?: ChordSessionDeps & SingMountDeps,
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
