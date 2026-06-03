import { randomEnabledChordQuestion } from "../chord-type-preference.ts";
import { chordMidis, chordTarget } from "../chords.ts";
import { playChord, playTargetNote } from "../audio/playback.ts";
import { randomNoteInRange } from "../notes.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";
import { mountSingTest, type SingTestConfig } from "./sing-test.ts";

export const singleNoteTestConfig: SingTestConfig = {
  title: "Sing a single note",
  subtitle: "Sing back the note you hear",
  playButtonLabel: "Play note",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the reference note.",
    playing: "Listen…",
    ready: "Sing the note you heard, then tap Start singing when ready.",
    recording: "Singing… tap Done when finished.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again to sing the same note (up to 3 tries).",
    failExhausted: "Out of tries on this note — tap Next question to continue.",
  },
  prepareQuestion: () => ({
    target: randomNoteInRange(getActiveNoteRange()),
  }),
  playReference: (question) => playTargetNote(question.target.midi),
};

export const chordMiddleTestConfig: SingTestConfig = {
  title: "Sing the middle note",
  subtitle: "Hear a chord and sing the middle note",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  showChordTypePicker: true,
  showInversionPicker: true,
  status: {
    idle: "Press Play to hear the chord.",
    noChordTypes: "Select at least one chord type to begin.",
    noInversions: "Select at least one inversion to begin.",
    playing: "Listen to the chord…",
    ready: "Sing the middle note of the chord, then tap Start singing when ready.",
    recording: "Singing… tap Done when finished.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again to sing the same chord (up to 3 tries).",
    failExhausted: "Out of tries on this chord — tap Next question to continue.",
  },
  prepareQuestion: () => {
    const chord = randomEnabledChordQuestion(getActiveNoteRange());
    return { target: chordTarget(chord), chord };
  },
  playReference: (question) => {
    if (!question.chord) {
      throw new Error("Missing chord for playback");
    }
    return playChord(chordMidis(question.chord));
  },
};

export function mountSingleNoteTest(root: HTMLElement): void {
  mountSingTest(root, singleNoteTestConfig);
}

export function mountChordMiddleTest(root: HTMLElement): void {
  mountSingTest(root, chordMiddleTestConfig);
}
