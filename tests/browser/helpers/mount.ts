import { createTestAudioPort } from "../../../src/audio/port.ts"
import { createTestRecordingPort } from "../../../src/audio/recording-port.ts"
import { MAJOR_TRIAD_SING_MIDDLE } from "../../../src/chord-config.ts"
import { resetInversionPreference } from "../../../src/chord-inversion-preference.ts"
import { resetChordTypePreference } from "../../../src/chord-type-preference.ts"
import { buildChordExercise } from "../../../src/chord-types.ts"
import { chordTarget } from "../../../src/chords.ts"
import { getScaleDegreeKeyQualityLabel } from "../../../src/curriculum/scale-degree-tiers.ts"
import { createMemoryHistoryPort, type HistoryPort } from "../../../src/history/port.ts"
import {
  createSessionHistoryCache,
  type SessionHistoryCache,
} from "../../../src/history/session-cache.ts"
import type { AttemptRecord, PracticeModeId } from "../../../src/history/types.ts"
import { getIntervalById, INTERVAL_2A_IDS } from "../../../src/interval-config.ts"
import { buildIntervalExercise, intervalToLessonExercise } from "../../../src/interval-exercises.ts"
import { midiToHz } from "../../../src/notes.ts"
import { getPracticeMode } from "../../../src/practice-modes/registry.ts"
import { getScaleDegreeById } from "../../../src/scale-degree-config.ts"
import {
  buildScaleDegreeExercise,
  scaleDegreeToLessonExercise,
} from "../../../src/scale-degree-exercises.ts"
import { resetScaleDegreePreference } from "../../../src/scale-degree-preference.ts"
import { mountPracticeModePage } from "../../../src/ui/exercise-page.ts"
import { mountHome } from "../../../src/ui/home.tsx"
import {
  type IdentifyMountDeps,
  type IdentifyTestConfig,
  mountIdentifyTest,
} from "../../../src/ui/identify-test.ts"
import {
  intervalHarmonicIdConfig,
  intervalHarmonicSingConfig,
  intervalMelodicIdConfig,
  intervalMelodicSingConfig,
} from "../../../src/ui/interval-tests.ts"
import { scaleDegreeSingConfig } from "../../../src/ui/scale-degree-tests.ts"
import {
  mountSingTest,
  type SingMountDeps,
  type SingTestConfig,
} from "../../../src/ui/sing-test.ts"
import { mountStats } from "../../../src/ui/stats.ts"
import { chordMiddleTestConfig, singleNoteTestConfig } from "../../../src/ui/tests.ts"
import { resetVoiceTypePreference } from "../../../src/voice-ranges.ts"
import "../../../src/ui/styles.css"

export function createTestSessionHistory(records: AttemptRecord[] = []): {
  sessionHistory: SessionHistoryCache
  history: HistoryPort
} {
  const history = createMemoryHistoryPort(records)
  const sessionHistory = createSessionHistoryCache(history, { initialRecords: records })
  return { sessionHistory, history }
}

function createAppRoot(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.querySelector<HTMLElement>("#app")
  if (!root) {
    throw new Error("#app element not found")
  }
  return root
}

/** Sets `location.search` for curriculum `?unlock=all` browser tests. */
export function setUnlockAllSearch(enabled: boolean): void {
  const url = new URL(window.location.href)
  if (enabled) {
    url.searchParams.set("unlock", "all")
  } else {
    url.searchParams.delete("unlock")
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}`)
}

/** Sets the guided-path `step` query param (and clears unlock-all unless provided). */
export function setCurriculumLessonSearch(
  step: { practiceModeId: PracticeModeId; contentTierId: string } | null,
  options?: { unlockAll?: boolean },
): void {
  const url = new URL(window.location.href)
  if (step) {
    url.searchParams.set("step", `${step.practiceModeId}:${step.contentTierId}`)
  } else {
    url.searchParams.delete("step")
  }
  if (options?.unlockAll) {
    url.searchParams.set("unlock", "all")
  } else {
    url.searchParams.delete("unlock")
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}`)
}

function getLocationSearch(): string {
  return window.location.search
}

export async function mountHomeWithHistory(records: AttemptRecord[]): Promise<void> {
  const root = createAppRoot()
  await mountHome(root, { history: createMemoryHistoryPort(records) })
}

export async function mountPracticeModePageWithHistory(
  practiceModeId: PracticeModeId,
  records: AttemptRecord[],
  options?: { locationSearch?: string; history?: HistoryPort },
): Promise<{ history: HistoryPort }> {
  const root = createAppRoot()
  const history = options?.history ?? createMemoryHistoryPort(records)
  await mountPracticeModePage(root, practiceModeId, {
    history,
    locationSearch: options?.locationSearch ?? getLocationSearch(),
  })
  return { history }
}

export async function mountStatsWithHistory(records: AttemptRecord[]): Promise<void> {
  const root = createAppRoot()
  await mountStats(root, { history: createMemoryHistoryPort(records) })
}

const perfectFifth = getIntervalById("perfect-fifth")!

const fixedSingleNoteTarget = {
  name: "C4",
  midi: 60,
  hz: 261.63,
} as const

const fixedChordExercise = buildChordExercise(MAJOR_TRIAD_SING_MIDDLE, "root", 52)

const scaleDegreeFifth = getScaleDegreeById("fifth")!

export interface MountExerciseResult {
  history: HistoryPort
}

function resetPreferencesFor(practiceModeId: PracticeModeId): void {
  resetVoiceTypePreference()
  switch (practiceModeId) {
    case "chord-middle":
      resetChordTypePreference()
      resetInversionPreference()
      break
    case "interval-melodic-sing":
    case "interval-harmonic-sing":
    case "interval-melodic-id":
    case "interval-harmonic-id":
      break
    case "scale-degree-sing":
      resetScaleDegreePreference()
      break
    default:
      break
  }
}

function createSingTestConfigFor(
  practiceModeId: PracticeModeId,
  overrides?: Partial<SingTestConfig>,
): SingTestConfig {
  switch (practiceModeId) {
    case "single-note":
      return {
        ...singleNoteTestConfig,
        prepareExercise: () => ({ target: { ...fixedSingleNoteTarget } }),
        playReference: async () => {},
        ...overrides,
      }
    case "chord-middle":
      return {
        ...chordMiddleTestConfig,
        prepareExercise: () => ({
          target: chordTarget(fixedChordExercise),
          chord: fixedChordExercise,
          chordTypeId: MAJOR_TRIAD_SING_MIDDLE.id,
          inversionId: "root",
          contentTierId: "chord-1a",
          eligibleTagIds: [
            "major-triad-sing-middle",
            "minor-triad-sing-middle",
            "diminished-triad-sing-middle",
          ],
        }),
        playReference: async () => {},
        ...overrides,
      }
    case "interval-melodic-sing":
      return {
        ...intervalMelodicSingConfig,
        prepareExercise: () => ({
          ...intervalToLessonExercise(buildIntervalExercise(perfectFifth, "melodic", 60)),
          contentTierId: "interval-2a",
          eligibleTagIds: INTERVAL_2A_IDS,
        }),
        playReference: async () => {},
        ...overrides,
      }
    case "interval-harmonic-sing":
      return {
        ...intervalHarmonicSingConfig,
        prepareExercise: () => ({
          ...intervalToLessonExercise(buildIntervalExercise(perfectFifth, "harmonic", 60)),
          contentTierId: "interval-2a",
          eligibleTagIds: INTERVAL_2A_IDS,
        }),
        playReference: async () => {},
        ...overrides,
      }
    case "scale-degree-sing":
      return {
        ...scaleDegreeSingConfig,
        lessonBanner: getScaleDegreeKeyQualityLabel("degree-major-intro") ?? undefined,
        prepareExercise: () => ({
          ...scaleDegreeToLessonExercise(buildScaleDegreeExercise(scaleDegreeFifth, 60)),
          contentTierId: "degree-major-intro",
          eligibleTagIds: ["fourth", "fifth", "octave"],
        }),
        playReference: async () => {},
        ...overrides,
      }
    default:
      throw new Error(`Not a sing exercise: ${practiceModeId}`)
  }
}

function createIdentifyTestConfigFor(
  practiceModeId: PracticeModeId,
  overrides?: Partial<IdentifyTestConfig>,
): IdentifyTestConfig {
  const base =
    practiceModeId === "interval-harmonic-id" ? intervalHarmonicIdConfig : intervalMelodicIdConfig
  const presentation = practiceModeId === "interval-harmonic-id" ? "harmonic" : "melodic"
  return {
    ...base,
    prepareExercise: () => ({
      ...intervalToLessonExercise(buildIntervalExercise(perfectFifth, presentation, 60)),
      contentTierId: "interval-2a",
      eligibleTagIds: INTERVAL_2A_IDS,
    }),
    playReference: async () => {},
    ...overrides,
  }
}

export function defaultPassSamplesHzFor(practiceModeId: PracticeModeId): number[] {
  switch (practiceModeId) {
    case "single-note":
      return Array(20).fill(fixedSingleNoteTarget.hz)
    case "chord-middle":
      return Array(20).fill(midiToHz(chordTarget(fixedChordExercise).midi))
    case "interval-melodic-sing":
    case "interval-harmonic-sing": {
      const q = buildIntervalExercise(
        perfectFifth,
        practiceModeId === "interval-harmonic-sing" ? "harmonic" : "melodic",
        60,
      )
      return Array(20).fill(midiToHz(q.upper.midi))
    }
    case "scale-degree-sing":
      return Array(20).fill(midiToHz(67))
    default:
      throw new Error(`No default pass samples for ${practiceModeId}`)
  }
}

export interface MountExerciseInBrowserOptions {
  config?: Partial<SingTestConfig> | Partial<IdentifyTestConfig>
  deps?: SingMountDeps | IdentifyMountDeps
  samplesHz?: number[]
  resetPreferences?: boolean
}

export function mountPracticeModeInBrowser(
  practiceModeId: PracticeModeId,
  options: MountExerciseInBrowserOptions = {},
): MountExerciseResult {
  if (options.resetPreferences !== false) {
    resetPreferencesFor(practiceModeId)
  }

  const { responseMode } = getPracticeMode(practiceModeId)
  const history = options.deps?.history ?? createMemoryHistoryPort()
  const root = createAppRoot()
  const audio = options.deps?.audio ?? createTestAudioPort()
  const configOverrides = options.config as
    | Partial<SingTestConfig>
    | Partial<IdentifyTestConfig>
    | undefined

  if (responseMode === "select") {
    const identifyDeps = options.deps as IdentifyMountDeps | undefined
    mountIdentifyTest(root, createIdentifyTestConfigFor(practiceModeId, configOverrides), {
      history,
      audio,
      exercisesPerLesson: identifyDeps?.exercisesPerLesson,
    })
    return { history }
  }

  const samplesHz = options.samplesHz ?? defaultPassSamplesHzFor(practiceModeId)
  const singDeps = options.deps as SingMountDeps | undefined
  mountSingTest(root, createSingTestConfigFor(practiceModeId, configOverrides), {
    history,
    audio,
    recording: singDeps?.recording ?? createTestRecordingPort({ samplesHz }),
    exercisesPerLesson: singDeps?.exercisesPerLesson,
  })
  return { history }
}

export function createMelodicIdTestConfig(
  overrides?: Partial<IdentifyTestConfig>,
): IdentifyTestConfig {
  return createIdentifyTestConfigFor("interval-melodic-id", overrides)
}

export function createHarmonicSingTestConfig(overrides?: Partial<SingTestConfig>): SingTestConfig {
  return createSingTestConfigFor("interval-harmonic-sing", overrides)
}

export interface MountMelodicIdResult {
  history: HistoryPort
}

export function mountMelodicIntervalIdTest(options?: {
  config?: IdentifyTestConfig
  deps?: IdentifyMountDeps
  resetPreferences?: boolean
}): MountMelodicIdResult {
  return mountPracticeModeInBrowser("interval-melodic-id", {
    config: options?.config,
    deps: options?.deps,
    resetPreferences: options?.resetPreferences,
  })
}

export interface MountSingleNoteSingOptions {
  config?: SingTestConfig
  deps?: SingMountDeps
  samplesHz: number[]
  resetPreferences?: boolean
}

export function mountSingleNoteSingTest(options: MountSingleNoteSingOptions): MountMelodicIdResult {
  return mountPracticeModeInBrowser("single-note", {
    config: options.config,
    deps: options.deps,
    samplesHz: options.samplesHz,
    resetPreferences: options.resetPreferences,
  })
}

export interface MountScaleDegreeSingOptions {
  config?: SingTestConfig
  deps?: SingMountDeps
  samplesHz: number[]
  resetPreferences?: boolean
}

export function mountScaleDegreeSingTest(
  options: MountScaleDegreeSingOptions,
): MountMelodicIdResult {
  return mountPracticeModeInBrowser("scale-degree-sing", {
    config: options.config,
    deps: options.deps,
    samplesHz: options.samplesHz,
    resetPreferences: options.resetPreferences,
  })
}
