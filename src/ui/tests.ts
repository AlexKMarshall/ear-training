import { chordMidis } from "../chords.ts";
import { playChord, playTargetNote } from "../audio/playback.ts";
import { randomNoteInRange } from "../notes.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";
import type { MountDeps } from "../history/port.ts";
import { mountSingTest, type SingMountDeps, type SingTestConfig } from "./sing-test.ts";
import {
  prepareChordQuestion,
  resolveChordSession,
  type ChordSessionDeps,
} from "./chord-session.ts";

export const singleNoteTestConfig: SingTestConfig = {
  exerciseId: "single-note",
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
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  prepareQuestion: () => ({
    target: randomNoteInRange(getActiveNoteRange()),
  }),
  playReference: (question) => playTargetNote(question.target.midi),
};

const chordMiddleBase = {
  exerciseId: "chord-middle" as const,
  title: "Sing the middle note",
  subtitle: "Hear a chord and sing the middle note",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  showChordTypePicker: false,
  showInversionPicker: false,
  status: {
    idle: "Press Play to hear the chord.",
    noChordTypes: "",
    noInversions: "",
    playing: "Listen to the chord…",
    ready: "Sing the middle note of the chord, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  playReference: (question: Parameters<SingTestConfig["playReference"]>[0]) => {
    if (!question.chord) {
      throw new Error("Missing chord for playback");
    }
    return playChord(chordMidis(question.chord));
  },
};

export const chordMiddleTestConfig: SingTestConfig = {
  ...chordMiddleBase,
  prepareQuestion: () => prepareChordQuestion([]),
};

export function mountSingleNoteTest(
  root: HTMLElement,
  _deps?: MountDeps & SingMountDeps,
): void {
  mountSingTest(root, singleNoteTestConfig);
}

export function mountChordMiddleTest(
  root: HTMLElement,
  deps?: ChordSessionDeps & SingMountDeps,
): void {
  const { cache, planner, rng } = resolveChordSession(deps);
  mountSingTest(
    root,
    {
      ...chordMiddleBase,
      prepareQuestion: () =>
        prepareChordQuestion(
          cache.getRecords(),
          planner,
          undefined,
          rng,
          deps?.sessionStep,
        ),
    },
    { ...deps, history: cache.historyPort },
  );
}
