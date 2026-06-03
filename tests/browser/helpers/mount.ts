import { createTestAudioPort } from "../../../src/audio/port.ts";
import { getIntervalById } from "../../../src/interval-config.ts";
import {
  buildIntervalQuestion,
  intervalToSingTestQuestion,
} from "../../../src/interval-questions.ts";
import { resetIntervalPreference } from "../../../src/interval-preference.ts";
import {
  createMemoryHistoryPort,
  type HistoryPort,
} from "../../../src/history/port.ts";
import type { AttemptRecord, ExerciseId } from "../../../src/history/types.ts";
import {
  mountIdentifyTest,
  type IdentifyMountDeps,
  type IdentifyTestConfig,
} from "../../../src/ui/identify-test.ts";
import { intervalMelodicIdConfig } from "../../../src/ui/interval-tests.ts";
import { mountExercisePage } from "../../../src/ui/exercise-page.ts";
import { mountHome } from "../../../src/ui/home.ts";
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

export function createMelodicIdTestConfig(
  overrides?: Partial<IdentifyTestConfig>,
): IdentifyTestConfig {
  return {
    ...intervalMelodicIdConfig,
    prepareQuestion: () =>
      intervalToSingTestQuestion(
        buildIntervalQuestion(perfectFifth, "melodic", 60),
      ),
    playReference: async () => {},
    ...overrides,
  };
}

export interface MountMelodicIdResult {
  history: HistoryPort;
}

export function mountMelodicIntervalIdTest(options?: {
  config?: IdentifyTestConfig;
  deps?: IdentifyMountDeps;
  /** When false, caller must set interval/voice prefs before mount. Default true. */
  resetPreferences?: boolean;
}): MountMelodicIdResult {
  if (options?.resetPreferences !== false) {
    resetIntervalPreference();
    resetVoiceTypePreference();
  }
  const history = options?.deps?.history ?? createMemoryHistoryPort();
  const root = createAppRoot();
  mountIdentifyTest(
    root,
    options?.config ?? createMelodicIdTestConfig(),
    {
      history,
      audio: options?.deps?.audio ?? createTestAudioPort(),
    },
  );
  return { history };
}
