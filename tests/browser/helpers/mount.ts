import { createTestAudioPort } from "../../../src/audio/port.ts";
import { createTestRecordingPort } from "../../../src/audio/recording-port.ts";
import { MAJOR_TRIAD_SING_MIDDLE } from "../../../src/chord-config.ts";
import { resetInversionPreference } from "../../../src/chord-inversion-preference.ts";
import { resetChordTypePreference } from "../../../src/chord-type-preference.ts";
import { buildChordQuestion } from "../../../src/chord-types.ts";
import { chordTarget } from "../../../src/chords.ts";
import { getExercise } from "../../../src/exercises/registry.ts";
import { getIntervalById } from "../../../src/interval-config.ts";
import {
  buildIntervalQuestion,
  intervalToSingTestQuestion,
} from "../../../src/interval-questions.ts";
import { resetIntervalPreference } from "../../../src/interval-preference.ts";
import { getScaleDegreeById } from "../../../src/scale-degree-config.ts";
import {
  buildScaleDegreeQuestion,
  scaleDegreeToSingTestQuestion,
} from "../../../src/scale-degree-questions.ts";
import { resetScaleDegreePreference } from "../../../src/scale-degree-preference.ts";
import {
  createMemoryHistoryPort,
  type HistoryPort,
} from "../../../src/history/port.ts";
import type { AttemptRecord, ExerciseId } from "../../../src/history/types.ts";
import { midiToHz } from "../../../src/notes.ts";
import {
  mountIdentifyTest,
  type IdentifyMountDeps,
  type IdentifyTestConfig,
} from "../../../src/ui/identify-test.ts";
import {
  intervalHarmonicIdConfig,
  intervalHarmonicSingConfig,
  intervalMelodicIdConfig,
  intervalMelodicSingConfig,
} from "../../../src/ui/interval-tests.ts";
import { scaleDegreeSingConfig } from "../../../src/ui/scale-degree-tests.ts";
import { mountExercisePage } from "../../../src/ui/exercise-page.ts";
import { mountHome } from "../../../src/ui/home.ts";
import {
  mountSingTest,
  type SingMountDeps,
  type SingTestConfig,
} from "../../../src/ui/sing-test.ts";
import {
  chordMiddleTestConfig,
  singleNoteTestConfig,
} from "../../../src/ui/tests.ts";
import { mountStats } from "../../../src/ui/stats.ts";
import { resetVoiceTypePreference } from "../../../src/voice-ranges.ts";
import "../../../src/ui/styles.css";

function createAppRoot(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("#app element not found");
  }
  return root;
}

/** Sets `location.search` for curriculum `?unlock=all` browser tests. */
export function setUnlockAllSearch(enabled: boolean): void {
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set("unlock", "all");
  } else {
    url.searchParams.delete("unlock");
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

export async function mountHomeWithHistory(
  records: AttemptRecord[],
): Promise<void> {
  const root = createAppRoot();
  await mountHome(root, { history: createMemoryHistoryPort(records) });
}

export async function mountExercisePageWithHistory(
  exerciseId: ExerciseId,
  records: AttemptRecord[],
): Promise<void> {
  const root = createAppRoot();
  await mountExercisePage(root, exerciseId, {
    history: createMemoryHistoryPort(records),
  });
}

export async function mountStatsWithHistory(
  records: AttemptRecord[],
): Promise<void> {
  const root = createAppRoot();
  await mountStats(root, { history: createMemoryHistoryPort(records) });
}

const perfectFifth = getIntervalById("perfect-fifth")!;

const fixedSingleNoteTarget = {
  name: "C4",
  midi: 60,
  hz: 261.63,
} as const;

const fixedChordQuestion = buildChordQuestion(
  MAJOR_TRIAD_SING_MIDDLE,
  "root",
  52,
);

const scaleDegreeFifth = getScaleDegreeById("fifth")!;

export interface MountExerciseResult {
  history: HistoryPort;
}

function resetPreferencesFor(exerciseId: ExerciseId): void {
  resetVoiceTypePreference();
  switch (exerciseId) {
    case "chord-middle":
      resetChordTypePreference();
      resetInversionPreference();
      break;
    case "interval-melodic-sing":
    case "interval-harmonic-sing":
    case "interval-melodic-id":
    case "interval-harmonic-id":
      resetIntervalPreference();
      break;
    case "scale-degree-sing":
      resetScaleDegreePreference();
      break;
    default:
      break;
  }
}

function createSingTestConfigFor(
  exerciseId: ExerciseId,
  overrides?: Partial<SingTestConfig>,
): SingTestConfig {
  switch (exerciseId) {
    case "single-note":
      return {
        ...singleNoteTestConfig,
        prepareQuestion: () => ({ target: { ...fixedSingleNoteTarget } }),
        playReference: async () => {},
        ...overrides,
      };
    case "chord-middle":
      return {
        ...chordMiddleTestConfig,
        prepareQuestion: () => ({
          target: chordTarget(fixedChordQuestion),
          chord: fixedChordQuestion,
          chordTypeId: MAJOR_TRIAD_SING_MIDDLE.id,
          inversionId: "root",
        }),
        playReference: async () => {},
        ...overrides,
      };
    case "interval-melodic-sing":
      return {
        ...intervalMelodicSingConfig,
        prepareQuestion: () =>
          intervalToSingTestQuestion(
            buildIntervalQuestion(perfectFifth, "melodic", 60),
          ),
        playReference: async () => {},
        ...overrides,
      };
    case "interval-harmonic-sing":
      return {
        ...intervalHarmonicSingConfig,
        prepareQuestion: () =>
          intervalToSingTestQuestion(
            buildIntervalQuestion(perfectFifth, "harmonic", 60),
          ),
        playReference: async () => {},
        ...overrides,
      };
    case "scale-degree-sing":
      return {
        ...scaleDegreeSingConfig,
        prepareQuestion: () =>
          scaleDegreeToSingTestQuestion(
            buildScaleDegreeQuestion(scaleDegreeFifth, 60),
          ),
        playReference: async () => {},
        ...overrides,
      };
    default:
      throw new Error(`Not a sing exercise: ${exerciseId}`);
  }
}

function createIdentifyTestConfigFor(
  exerciseId: ExerciseId,
  overrides?: Partial<IdentifyTestConfig>,
): IdentifyTestConfig {
  const base =
    exerciseId === "interval-harmonic-id"
      ? intervalHarmonicIdConfig
      : intervalMelodicIdConfig;
  return {
    ...base,
    prepareQuestion: () =>
      intervalToSingTestQuestion(
        buildIntervalQuestion(
          perfectFifth,
          exerciseId === "interval-harmonic-id" ? "harmonic" : "melodic",
          60,
        ),
      ),
    playReference: async () => {},
    ...overrides,
  };
}

export function defaultPassSamplesHzFor(exerciseId: ExerciseId): number[] {
  switch (exerciseId) {
    case "single-note":
      return Array(20).fill(fixedSingleNoteTarget.hz);
    case "chord-middle":
      return Array(20).fill(midiToHz(chordTarget(fixedChordQuestion).midi));
    case "interval-melodic-sing":
    case "interval-harmonic-sing": {
      const q = buildIntervalQuestion(
        perfectFifth,
        exerciseId === "interval-harmonic-sing" ? "harmonic" : "melodic",
        60,
      );
      return Array(20).fill(midiToHz(q.upper.midi));
    }
    case "scale-degree-sing":
      return Array(20).fill(midiToHz(67));
    default:
      throw new Error(`No default pass samples for ${exerciseId}`);
  }
}

export interface MountExerciseInBrowserOptions {
  config?: Partial<SingTestConfig> | Partial<IdentifyTestConfig>;
  deps?: SingMountDeps | IdentifyMountDeps;
  samplesHz?: number[];
  resetPreferences?: boolean;
}

export function mountExerciseInBrowser(
  exerciseId: ExerciseId,
  options: MountExerciseInBrowserOptions = {},
): MountExerciseResult {
  if (options.resetPreferences !== false) {
    resetPreferencesFor(exerciseId);
  }

  const { responseMode } = getExercise(exerciseId);
  const history =
    options.deps?.history ?? createMemoryHistoryPort();
  const root = createAppRoot();
  const audio = options.deps?.audio ?? createTestAudioPort();

  if (responseMode === "select") {
    mountIdentifyTest(
      root,
      createIdentifyTestConfigFor(
        exerciseId,
        options.config as Partial<IdentifyTestConfig> | undefined,
      ),
      { history, audio },
    );
    return { history };
  }

  const samplesHz =
    options.samplesHz ?? defaultPassSamplesHzFor(exerciseId);
  mountSingTest(
    root,
    createSingTestConfigFor(
      exerciseId,
      options.config as Partial<SingTestConfig> | undefined,
    ),
    {
      history,
      audio,
      recording:
        (options.deps as SingMountDeps | undefined)?.recording ??
        createTestRecordingPort({ samplesHz }),
    },
  );
  return { history };
}

export function createMelodicIdTestConfig(
  overrides?: Partial<IdentifyTestConfig>,
): IdentifyTestConfig {
  return createIdentifyTestConfigFor("interval-melodic-id", overrides);
}

export function createSingleNoteTestConfig(
  overrides?: Partial<SingTestConfig>,
): SingTestConfig {
  return createSingTestConfigFor("single-note", overrides);
}

export function createScaleDegreeSingTestConfig(
  overrides?: Partial<SingTestConfig>,
): SingTestConfig {
  return createSingTestConfigFor("scale-degree-sing", overrides);
}

export interface MountMelodicIdResult {
  history: HistoryPort;
}

export function mountMelodicIntervalIdTest(options?: {
  config?: IdentifyTestConfig;
  deps?: IdentifyMountDeps;
  resetPreferences?: boolean;
}): MountMelodicIdResult {
  return mountExerciseInBrowser("interval-melodic-id", {
    config: options?.config,
    deps: options?.deps,
    resetPreferences: options?.resetPreferences,
  });
}

export interface MountSingleNoteSingOptions {
  config?: SingTestConfig;
  deps?: SingMountDeps;
  samplesHz: number[];
  resetPreferences?: boolean;
}

export function mountSingleNoteSingTest(
  options: MountSingleNoteSingOptions,
): MountMelodicIdResult {
  return mountExerciseInBrowser("single-note", {
    config: options.config,
    deps: options.deps,
    samplesHz: options.samplesHz,
    resetPreferences: options.resetPreferences,
  });
}

export interface MountScaleDegreeSingOptions {
  config?: SingTestConfig;
  deps?: SingMountDeps;
  samplesHz: number[];
  resetPreferences?: boolean;
}

export function mountScaleDegreeSingTest(
  options: MountScaleDegreeSingOptions,
): MountMelodicIdResult {
  return mountExerciseInBrowser("scale-degree-sing", {
    config: options.config,
    deps: options.deps,
    samplesHz: options.samplesHz,
    resetPreferences: options.resetPreferences,
  });
}
