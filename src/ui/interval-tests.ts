import { playDyad, playMelodicSequence } from "../audio/playback.ts";
import type { ExerciseId } from "../history/types.ts";
import type { SingTestQuestion } from "../sing-test-question.ts";
import { mountIdentifyTest, type IdentifyMountDeps, type IdentifyTestConfig } from "./identify-test.ts";
import {
  prepareIntervalQuestion,
  resolveIntervalSession,
  type IntervalSessionDeps,
} from "./interval-session.ts";
import { mountSingTest, type SingMountDeps, type SingTestConfig } from "./sing-test.ts";

const intervalMelodicSingBase = {
  exerciseId: "interval-melodic-sing" as const,
  title: "Sing melodic intervals",
  subtitle: "Hear two notes in sequence, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: false,
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready:
      "Sing the top note of the interval, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  playReference: (question: SingTestQuestion) => {
    if (!question.interval) {
      throw new Error("Missing interval for playback");
    }
    const { lower, upper } = question.interval;
    return playMelodicSequence([lower.midi, upper.midi]);
  },
};

export const intervalMelodicSingConfig: SingTestConfig = {
  ...intervalMelodicSingBase,
  prepareQuestion: () =>
    prepareIntervalQuestion("interval-melodic-sing", "melodic", []),
};

const intervalHarmonicSingBase = {
  exerciseId: "interval-harmonic-sing" as const,
  title: "Sing harmonic intervals",
  subtitle: "Hear two notes together, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: false,
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready:
      "Sing the top note of the interval, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  playReference: (question: SingTestQuestion) => {
    if (!question.interval) {
      throw new Error("Missing interval for playback");
    }
    const { lower, upper } = question.interval;
    return playDyad([lower.midi, upper.midi]);
  },
};

export const intervalHarmonicSingConfig: SingTestConfig = {
  ...intervalHarmonicSingBase,
  prepareQuestion: () =>
    prepareIntervalQuestion("interval-harmonic-sing", "harmonic", []),
};

function mountIntervalSingTest(
  root: HTMLElement,
  exerciseId: Extract<
    ExerciseId,
    "interval-melodic-sing" | "interval-harmonic-sing"
  >,
  presentation: "melodic" | "harmonic",
  base: Omit<SingTestConfig, "prepareQuestion">,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  const { cache, planner } = resolveIntervalSession(deps);
  mountSingTest(
    root,
    {
      ...base,
      prepareQuestion: () =>
        prepareIntervalQuestion(
          exerciseId,
          presentation,
          cache.getRecords(),
          planner,
          undefined,
          deps?.sessionStep,
        ),
    },
    { ...deps, history: cache.historyPort },
  );
}

export function mountIntervalMelodicSingTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  mountIntervalSingTest(
    root,
    "interval-melodic-sing",
    "melodic",
    intervalMelodicSingBase,
    deps,
  );
}

export function mountIntervalHarmonicSingTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  mountIntervalSingTest(
    root,
    "interval-harmonic-sing",
    "harmonic",
    intervalHarmonicSingBase,
    deps,
  );
}

const intervalMelodicIdBase = {
  exerciseId: "interval-melodic-id" as const,
  title: "Identify melodic intervals",
  subtitle: "Hear two notes in sequence, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: false,
  status: {
    idle: "Press Play to hear the interval.",
    noIntervals: "",
    tooFewIntervals: "",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  playReference: (question: SingTestQuestion) => {
    if (!question.interval) throw new Error("Missing interval for playback");
    const { lower, upper } = question.interval;
    return playMelodicSequence([lower.midi, upper.midi]);
  },
};

export const intervalMelodicIdConfig: IdentifyTestConfig = {
  ...intervalMelodicIdBase,
  prepareQuestion: () =>
    prepareIntervalQuestion("interval-melodic-id", "melodic", []),
};

const intervalHarmonicIdBase = {
  exerciseId: "interval-harmonic-id" as const,
  title: "Identify harmonic intervals",
  subtitle: "Hear two notes together, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  showIntervalPicker: false,
  status: {
    idle: "Press Play to hear the interval.",
    noIntervals: "",
    tooFewIntervals: "",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  playReference: (question: SingTestQuestion) => {
    if (!question.interval) throw new Error("Missing interval for playback");
    const { lower, upper } = question.interval;
    return playDyad([lower.midi, upper.midi]);
  },
};

export const intervalHarmonicIdConfig: IdentifyTestConfig = {
  ...intervalHarmonicIdBase,
  prepareQuestion: () =>
    prepareIntervalQuestion("interval-harmonic-id", "harmonic", []),
};

function mountIntervalIdentifyTest(
  root: HTMLElement,
  exerciseId: Extract<
    ExerciseId,
    "interval-melodic-id" | "interval-harmonic-id"
  >,
  presentation: "melodic" | "harmonic",
  base: Omit<IdentifyTestConfig, "prepareQuestion">,
  deps?: IntervalSessionDeps & IdentifyMountDeps,
): void {
  const { cache, planner } = resolveIntervalSession(deps);
  mountIdentifyTest(
    root,
    {
      ...base,
      prepareQuestion: () =>
        prepareIntervalQuestion(
          exerciseId,
          presentation,
          cache.getRecords(),
          planner,
          undefined,
          deps?.sessionStep,
        ),
    },
    { ...deps, history: cache.historyPort },
  );
}

export function mountIntervalMelodicIdTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & IdentifyMountDeps,
): void {
  mountIntervalIdentifyTest(
    root,
    "interval-melodic-id",
    "melodic",
    intervalMelodicIdBase,
    deps,
  );
}

export function mountIntervalHarmonicIdTest(
  root: HTMLElement,
  deps?: IntervalSessionDeps & IdentifyMountDeps,
): void {
  mountIntervalIdentifyTest(
    root,
    "interval-harmonic-id",
    "harmonic",
    intervalHarmonicIdBase,
    deps,
  );
}
