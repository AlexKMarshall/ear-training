import { playChord, playTargetNote } from "../audio/playback.ts";
import { chordMidis } from "../chords.ts";
import type { MountDeps } from "../history/port.ts";
import { randomNoteInRange } from "../notes.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";
import {
  type ChordSessionDeps,
  prepareChordExercise,
  resolveChordSession,
} from "./chord-session.ts";
import { mountSingTest, type SingMountDeps, type SingTestConfig } from "./sing-test.ts";

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
    target: randomNoteInRange(getActiveNoteRange()),
  }),
  playReference: (exercise) => playTargetNote(exercise.target.midi),
};

const chordMiddleBase = {
  practiceModeId: "chord-middle" as const,
  title: "Sing the middle note",
  subtitle: "Hear a chord and sing the middle note",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the chord.",
    playing: "Listen to the chord…",
    ready: "Sing the middle note of the chord, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: Parameters<SingTestConfig["playReference"]>[0]) => {
    if (!exercise.chord) {
      throw new Error("Missing chord for playback");
    }
    return playChord(chordMidis(exercise.chord));
  },
};

export const chordMiddleTestConfig: SingTestConfig = {
  ...chordMiddleBase,
  prepareExercise: () => prepareChordExercise([]),
};

export function mountSingleNoteTest(root: HTMLElement, _deps?: MountDeps & SingMountDeps): void {
  mountSingTest(root, singleNoteTestConfig);
}

export function mountChordMiddleTest(
  root: HTMLElement,
  deps?: ChordSessionDeps & SingMountDeps,
): void {
  const { sessionHistory, planner, rng } = resolveChordSession(deps ?? {});
  mountSingTest(
    root,
    {
      ...chordMiddleBase,
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
  );
}
