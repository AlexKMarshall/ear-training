import { playMelodicSequence } from "../audio/playback.ts";
import { randomIntervalSingQuestion } from "../interval-questions.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";
import { mountSingTest, type SingTestConfig } from "./sing-test.ts";

export const intervalMelodicSingConfig: SingTestConfig = {
  exerciseId: "interval-melodic-sing",
  title: "Sing melodic intervals",
  subtitle: "Hear two notes in sequence, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    noIntervals: "Select at least one interval to begin.",
    playing: "Listen to both notes…",
    ready:
      "Sing the top note of the interval, then tap Start singing when ready.",
    recording: "Singing… tap Done when finished.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  prepareQuestion: () =>
    randomIntervalSingQuestion("melodic", getActiveNoteRange()),
  playReference: (question) => {
    if (!question.interval) {
      throw new Error("Missing interval for playback");
    }
    const { lower, upper } = question.interval;
    return playMelodicSequence([lower.midi, upper.midi]);
  },
};

export function mountIntervalMelodicSingTest(root: HTMLElement): void {
  mountSingTest(root, intervalMelodicSingConfig);
}
