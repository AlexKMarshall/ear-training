import { playChord, playTargetNote } from "../audio/playback.ts"
import { chordMidis } from "../chords.ts"
import { getChordLessonBannerLabel, isChordContentTierId } from "../curriculum/chord-tiers.ts"
import type { MountDeps } from "../history/port.ts"
import { randomNoteInRange } from "../notes.ts"
import { getActiveNoteRange } from "../voice-ranges.ts"
import { exercisePromptForVoicingPosition } from "../voicing-position.ts"
import {
  type ChordSessionDeps,
  prepareChordExercise,
  resolveChordSession,
} from "./chord-session.ts"
import { mountSingTest, type SingMountDeps, type SingTestConfig } from "./sing-test.ts"

export const singleNoteTestConfig: SingTestConfig = {
  practiceModeId: "single-note",
  title: "Sing a single note",
  subtitle: "Sing back the note you hear",
  playButtonLabel: "Play note",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the reference note.",
    playing: "Listen…",
    ready: "Sing the note you heard, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  prepareExercise: () => ({
    type: "single-note",
    target: randomNoteInRange(getActiveNoteRange()),
  }),
  playReference: (exercise) => playTargetNote(exercise.target.midi),
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

export const chordSingTestConfig: SingTestConfig = {
  ...chordSingBase,
  prepareExercise: () => prepareChordExercise([]),
}

export function mountSingleNoteTest(root: HTMLElement, _deps?: MountDeps & SingMountDeps): void {
  mountSingTest(root, singleNoteTestConfig)
}

export function mountChordSingTest(
  root: HTMLElement,
  deps?: ChordSessionDeps & SingMountDeps,
): void {
  const { sessionHistory, planner, rng } = resolveChordSession(deps ?? {})
  const tierId = deps?.sessionCurriculumLesson?.contentTierId ?? "chord-major-root"
  const lessonBanner = isChordContentTierId(tierId) ? getChordLessonBannerLabel(tierId) : undefined

  mountSingTest(
    root,
    {
      ...chordSingBase,
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
