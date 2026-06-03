import { playDyad, playMelodicSequence } from "../audio/playback.ts";
import { randomIntervalSingQuestion } from "../interval-questions.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";
import {
  intervalToSingTestQuestion,
  randomIntervalQuestion,
} from "../interval-questions.ts";
import { mountIdentifyTest, type IdentifyTestConfig } from "./identify-test.ts";
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
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
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

export const intervalHarmonicSingConfig: SingTestConfig = {
  exerciseId: "interval-harmonic-sing",
  title: "Sing harmonic intervals",
  subtitle: "Hear two notes together, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    noIntervals: "Select at least one interval to begin.",
    playing: "Listen to both notes…",
    ready:
      "Sing the top note of the interval, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  prepareQuestion: () =>
    randomIntervalSingQuestion("harmonic", getActiveNoteRange()),
  playReference: (question) => {
    if (!question.interval) {
      throw new Error("Missing interval for playback");
    }
    const { lower, upper } = question.interval;
    return playDyad([lower.midi, upper.midi]);
  },
};

export function mountIntervalHarmonicSingTest(root: HTMLElement): void {
  mountSingTest(root, intervalHarmonicSingConfig);
}

function intervalIdentifyQuestion(
  presentation: "melodic" | "harmonic",
) {
  return intervalToSingTestQuestion(
    randomIntervalQuestion(presentation, getActiveNoteRange()),
  );
}

export const intervalMelodicIdConfig: IdentifyTestConfig = {
  exerciseId: "interval-melodic-id",
  title: "Identify melodic intervals",
  subtitle: "Hear two notes in sequence, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    noIntervals: "Select at least one interval to begin.",
    tooFewIntervals: "Select at least two intervals for multiple choice.",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  prepareQuestion: () => intervalIdentifyQuestion("melodic"),
  playReference: (question) => {
    if (!question.interval) throw new Error("Missing interval for playback");
    const { lower, upper } = question.interval;
    return playMelodicSequence([lower.midi, upper.midi]);
  },
};

const intervalHarmonicIdConfig: IdentifyTestConfig = {
  exerciseId: "interval-harmonic-id",
  title: "Identify harmonic intervals",
  subtitle: "Hear two notes together, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    noIntervals: "Select at least one interval to begin.",
    tooFewIntervals: "Select at least two intervals for multiple choice.",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  prepareQuestion: () => intervalIdentifyQuestion("harmonic"),
  playReference: (question) => {
    if (!question.interval) throw new Error("Missing interval for playback");
    const { lower, upper } = question.interval;
    return playDyad([lower.midi, upper.midi]);
  },
};

export function mountIntervalMelodicIdTest(root: HTMLElement): void {
  mountIdentifyTest(root, intervalMelodicIdConfig);
}

export function mountIntervalHarmonicIdTest(root: HTMLElement): void {
  mountIdentifyTest(root, intervalHarmonicIdConfig);
}
