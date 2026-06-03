import { chordFrequenciesHz, chordTarget } from "../chords.ts";
import { MAJOR_TRIAD_SING_MIDDLE } from "../chord-types/major-triad.ts";
import { randomChordQuestion } from "../chord-types.ts";
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
    pass: "Nice work!",
    fail: "Keep practicing — try again.",
  },
  prepareQuestion: () => ({
    target: randomNoteInRange(getActiveNoteRange()),
  }),
  playReference: (question) => playTargetNote(question.target.hz),
};

export const chordMiddleTestConfig: SingTestConfig = {
  title: "Sing the middle note",
  subtitle: "Hear a major chord and sing the middle note",
  playButtonLabel: "Play chord",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the chord.",
    playing: "Listen to the chord…",
    ready: "Sing the middle note of the chord, then tap Start singing when ready.",
    recording: "Singing… tap Done when finished.",
    pass: "Nice work!",
    fail: "Keep practicing — try again.",
  },
  prepareQuestion: () => {
    const chord = randomChordQuestion(
      MAJOR_TRIAD_SING_MIDDLE,
      getActiveNoteRange(),
    );
    return { target: chordTarget(chord), chord };
  },
  playReference: (question) => {
    if (!question.chord) {
      throw new Error("Missing chord for playback");
    }
    return playChord(chordFrequenciesHz(question.chord));
  },
};

export function mountSingleNoteTest(root: HTMLElement): void {
  mountSingTest(root, singleNoteTestConfig);
}

export function mountChordMiddleTest(root: HTMLElement): void {
  mountSingTest(root, chordMiddleTestConfig);
}
