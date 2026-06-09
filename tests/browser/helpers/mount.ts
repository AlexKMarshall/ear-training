import { createTestAudioPort } from "../../../src/audio/port.ts"
import { createTestRecordingPort } from "../../../src/audio/recording-port.ts"
import { MAJOR_TRIAD, MINOR_TRIAD } from "../../../src/chord-config.ts"
import { buildChordExercise } from "../../../src/chord-types.ts"
import { chordTarget } from "../../../src/chords.ts"
import { getChordLessonBannerLabel } from "../../../src/curriculum/chord-tiers.ts"
import { getScaleDegreeKeyQualityLabel } from "../../../src/curriculum/scale-degree-tiers.ts"
import type {
  ExerciseDefinition,
  SelectExerciseDefinition,
  SingExerciseDefinition,
} from "../../../src/exercise-definition.ts"
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
import { chordInversionIdExerciseDefinition } from "../../../src/ui/chord-inversion-id-tests.ts"
import { chordQualityIdExerciseDefinition } from "../../../src/ui/chord-quality-id-tests.ts"
import { mountPracticeModePage } from "../../../src/ui/exercise-page.ts"
import { mountHome } from "../../../src/ui/home.tsx"
import {
  intervalHarmonicIdExerciseDefinition,
  intervalHarmonicSingExerciseDefinition,
  intervalMelodicIdExerciseDefinition,
  intervalMelodicSingExerciseDefinition,
  intervalNamedSingExerciseDefinition,
} from "../../../src/ui/interval-tests.ts"
import { type ExerciseMountDeps, mountExercise } from "../../../src/ui/mount-exercise.ts"
import { scaleDegreeSingExerciseDefinition } from "../../../src/ui/scale-degree-tests.ts"
import { mountStats } from "../../../src/ui/stats.ts"
import { chordSingExerciseDefinition, singleNoteExerciseDefinition } from "../../../src/ui/tests.ts"
import { resetVoiceTypePreference } from "../../../src/voice-ranges.ts"
import { defined } from "../../helpers/defined.ts"
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

const perfectFifth = defined(getIntervalById("perfect-fifth"), "perfect-fifth")

const fixedSingleNoteTarget = {
  name: "C4",
  midi: 60,
  hz: 261.63,
} as const

const fixedChordExercise = buildChordExercise(MAJOR_TRIAD, "root", 1, 52)

const scaleDegreeFifth = defined(getScaleDegreeById("fifth"), "fifth")

export interface MountExerciseResult {
  history: HistoryPort
}

function resetPreferencesFor(practiceModeId: PracticeModeId): void {
  resetVoiceTypePreference()
  switch (practiceModeId) {
    case "chord-sing":
    case "chord-quality-id":
    case "chord-inversion-id":
      break
    case "interval-melodic-sing":
    case "interval-named-sing":
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

function createSingDefinitionFor(
  practiceModeId: PracticeModeId,
  overrides?: Partial<SingExerciseDefinition>,
): SingExerciseDefinition {
  switch (practiceModeId) {
    case "single-note":
      return {
        ...singleNoteExerciseDefinition,
        prepareExercise: () => ({ type: "single-note", target: { ...fixedSingleNoteTarget } }),
        playReference: async () => {},
        ...overrides,
      }
    case "chord-sing":
      return {
        ...chordSingExerciseDefinition,
        lessonBanner: getChordLessonBannerLabel("chord-major-root"),
        prepareExercise: () => ({
          type: "chord",
          target: chordTarget(fixedChordExercise),
          chord: fixedChordExercise,
          chordTypeId: MAJOR_TRIAD.id,
          inversionId: "root",
          voicingPositionId: "middle",
          contentTierId: "chord-major-root",
          eligibleTagIds: ["bottom", "middle", "top"],
        }),
        playReference: async () => {},
        ...overrides,
      }
    case "interval-melodic-sing":
      return {
        ...intervalMelodicSingExerciseDefinition,
        prepareExercise: () => ({
          ...intervalToLessonExercise(buildIntervalExercise(perfectFifth, "melodic", 60)),
          contentTierId: "interval-2a",
          eligibleTagIds: INTERVAL_2A_IDS,
        }),
        playReference: async () => {},
        ...overrides,
      }
    case "interval-named-sing":
      return {
        ...intervalNamedSingExerciseDefinition,
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
        ...intervalHarmonicSingExerciseDefinition,
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
        ...scaleDegreeSingExerciseDefinition,
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

function createSelectDefinitionFor(
  practiceModeId: PracticeModeId,
  overrides?: Partial<SelectExerciseDefinition>,
): SelectExerciseDefinition {
  if (practiceModeId === "chord-quality-id") {
    const fixedChord = buildChordExercise(MAJOR_TRIAD, "root", 0, 48)
    return {
      ...chordQualityIdExerciseDefinition,
      prepareExercise: () => ({
        type: "chord",
        target: chordTarget(fixedChord),
        chord: fixedChord,
        chordTypeId: MAJOR_TRIAD.id,
        inversionId: "root",
        contentTierId: "chord-quality-root",
        eligibleTagIds: [MAJOR_TRIAD.id, MINOR_TRIAD.id],
      }),
      playReference: async () => {},
      ...overrides,
    }
  }

  if (practiceModeId === "chord-inversion-id") {
    const fixedChord = buildChordExercise(MAJOR_TRIAD, "root", 0, 48)
    return {
      ...chordInversionIdExerciseDefinition,
      prepareExercise: () => ({
        type: "chord",
        target: chordTarget(fixedChord),
        chord: fixedChord,
        chordTypeId: MAJOR_TRIAD.id,
        inversionId: "root",
        contentTierId: "chord-inversion-major",
        eligibleTagIds: ["root", "first", "second"],
      }),
      playReference: async () => {},
      ...overrides,
    }
  }

  const base =
    practiceModeId === "interval-harmonic-id"
      ? intervalHarmonicIdExerciseDefinition
      : intervalMelodicIdExerciseDefinition
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
    case "chord-sing":
      return Array(20).fill(midiToHz(chordTarget(fixedChordExercise).midi))
    case "interval-melodic-sing":
    case "interval-named-sing":
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
  definition?: Partial<ExerciseDefinition>
  deps?: ExerciseMountDeps
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
  const definitionOverrides = options.definition

  if (responseMode === "select") {
    const definition = createSelectDefinitionFor(
      practiceModeId,
      definitionOverrides as Partial<SelectExerciseDefinition> | undefined,
    )
    mountExercise(root, definition, {
      history,
      audio,
      exercisesPerLesson: options.deps?.exercisesPerLesson,
    })
    return { history }
  }

  const samplesHz = options.samplesHz ?? defaultPassSamplesHzFor(practiceModeId)
  const definition = createSingDefinitionFor(
    practiceModeId,
    definitionOverrides as Partial<SingExerciseDefinition> | undefined,
  )
  mountExercise(root, definition, {
    history,
    audio,
    recording: options.deps?.recording ?? createTestRecordingPort({ samplesHz }),
    exercisesPerLesson: options.deps?.exercisesPerLesson,
  })
  return { history }
}

export function createMelodicIdDefinition(
  overrides?: Partial<SelectExerciseDefinition>,
): SelectExerciseDefinition {
  return createSelectDefinitionFor("interval-melodic-id", overrides)
}

export function createHarmonicSingDefinition(
  overrides?: Partial<SingExerciseDefinition>,
): SingExerciseDefinition {
  return createSingDefinitionFor("interval-harmonic-sing", overrides)
}

export interface MountMelodicIdResult {
  history: HistoryPort
}

export function mountMelodicIntervalIdTest(options?: {
  definition?: Partial<SelectExerciseDefinition>
  deps?: ExerciseMountDeps
  resetPreferences?: boolean
}): MountMelodicIdResult {
  return mountPracticeModeInBrowser("interval-melodic-id", {
    definition: options?.definition,
    deps: options?.deps,
    resetPreferences: options?.resetPreferences,
  })
}

export interface MountSingleNoteSingOptions {
  definition?: Partial<SingExerciseDefinition>
  deps?: ExerciseMountDeps
  samplesHz: number[]
  resetPreferences?: boolean
}

export function mountSingleNoteSingTest(options: MountSingleNoteSingOptions): MountMelodicIdResult {
  return mountPracticeModeInBrowser("single-note", {
    definition: options.definition,
    deps: options.deps,
    samplesHz: options.samplesHz,
    resetPreferences: options.resetPreferences,
  })
}

export interface MountScaleDegreeSingOptions {
  definition?: Partial<SingExerciseDefinition>
  deps?: ExerciseMountDeps
  samplesHz: number[]
  resetPreferences?: boolean
}

export function mountScaleDegreeSingTest(
  options: MountScaleDegreeSingOptions,
): MountMelodicIdResult {
  return mountPracticeModeInBrowser("scale-degree-sing", {
    definition: options.definition,
    deps: options.deps,
    samplesHz: options.samplesHz,
    resetPreferences: options.resetPreferences,
  })
}
