import { playDyad, playMelodicSequence } from "../audio/playback.ts";
import type { PracticeModeId } from "../history/types.ts";
import type { LessonExercise } from "../lesson-exercise.ts";
import { mountIdentifyTest, type IdentifyMountDeps, type IdentifyTestConfig } from "./identify-test.ts";
import {
  prepareIntervalExercise,
  resolveIntervalSession,
  type IntervalSessionDeps,
} from "./interval-session.ts";
import { mountSingTest, type SingMountDeps, type SingTestConfig } from "./sing-test.ts";

const intervalMelodicSingBase = {
  practiceModeId: "interval-melodic-sing" as const,
  title: "Sing melodic intervals",
  subtitle: "Hear two notes in sequence, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready:
      "Sing the top note of the interval, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: LessonExercise) => {
    if (!exercise.interval) {
      throw new Error("Missing interval for playback");
    }
    const { lower, upper } = exercise.interval;
    return playMelodicSequence([lower.midi, upper.midi]);
  },
};

export const intervalMelodicSingConfig: SingTestConfig = {
  ...intervalMelodicSingBase,
  prepareExercise: () =>
    prepareIntervalExercise("interval-melodic-sing", "melodic", []),
};

const intervalHarmonicSingBase = {
  practiceModeId: "interval-harmonic-sing" as const,
  title: "Sing harmonic intervals",
  subtitle: "Hear two notes together, then sing the top note",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready:
      "Sing the top note of the interval, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: LessonExercise) => {
    if (!exercise.interval) {
      throw new Error("Missing interval for playback");
    }
    const { lower, upper } = exercise.interval;
    return playDyad([lower.midi, upper.midi]);
  },
};

export const intervalHarmonicSingConfig: SingTestConfig = {
  ...intervalHarmonicSingBase,
  prepareExercise: () =>
    prepareIntervalExercise("interval-harmonic-sing", "harmonic", []),
};

function mountIntervalSingTest(
  root: HTMLElement,
  practiceModeId: Extract<
    PracticeModeId,
    "interval-melodic-sing" | "interval-harmonic-sing"
  >,
  presentation: "melodic" | "harmonic",
  base: Omit<SingTestConfig, "prepareExercise">,
  deps?: IntervalSessionDeps & SingMountDeps,
): void {
  const { sessionHistory, planner } = resolveIntervalSession(deps ?? {});
  mountSingTest(
    root,
    {
      ...base,
      prepareExercise: () =>
        prepareIntervalExercise(
          practiceModeId,
          presentation,
          sessionHistory.getRecords(),
          planner,
          undefined,
          deps?.sessionCurriculumLesson,
        ),
    },
    { ...deps, history: sessionHistory.historyPort },
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
  practiceModeId: "interval-melodic-id" as const,
  title: "Identify melodic intervals",
  subtitle: "Hear two notes in sequence, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: LessonExercise) => {
    if (!exercise.interval) throw new Error("Missing interval for playback");
    const { lower, upper } = exercise.interval;
    return playMelodicSequence([lower.midi, upper.midi]);
  },
};

export const intervalMelodicIdConfig: IdentifyTestConfig = {
  ...intervalMelodicIdBase,
  prepareExercise: () =>
    prepareIntervalExercise("interval-melodic-id", "melodic", []),
};

const intervalHarmonicIdBase = {
  practiceModeId: "interval-harmonic-id" as const,
  title: "Identify harmonic intervals",
  subtitle: "Hear two notes together, then choose the interval",
  playButtonLabel: "Play interval",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the interval.",
    playing: "Listen to both notes…",
    ready: "Choose the interval you heard.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: LessonExercise) => {
    if (!exercise.interval) throw new Error("Missing interval for playback");
    const { lower, upper } = exercise.interval;
    return playDyad([lower.midi, upper.midi]);
  },
};

export const intervalHarmonicIdConfig: IdentifyTestConfig = {
  ...intervalHarmonicIdBase,
  prepareExercise: () =>
    prepareIntervalExercise("interval-harmonic-id", "harmonic", []),
};

function mountIntervalIdentifyTest(
  root: HTMLElement,
  practiceModeId: Extract<
    PracticeModeId,
    "interval-melodic-id" | "interval-harmonic-id"
  >,
  presentation: "melodic" | "harmonic",
  base: Omit<IdentifyTestConfig, "prepareExercise">,
  deps?: IntervalSessionDeps & IdentifyMountDeps,
): void {
  const { sessionHistory, planner } = resolveIntervalSession(deps ?? {});
  mountIdentifyTest(
    root,
    {
      ...base,
      prepareExercise: () =>
        prepareIntervalExercise(
          practiceModeId,
          presentation,
          sessionHistory.getRecords(),
          planner,
          undefined,
          deps?.sessionCurriculumLesson,
        ),
    },
    { ...deps, history: sessionHistory.historyPort },
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
