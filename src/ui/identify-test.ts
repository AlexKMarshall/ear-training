import { createStore } from "solid-js/store"
import { render } from "solid-js/web"
import { createDefaultAudioPort } from "../audio/port.ts"
import { EXERCISES_PER_LESSON } from "../config.ts"
import type { ExerciseScreenResultView } from "../exercise-screen-state.ts"
import { ExerciseScreenState } from "../exercise-screen-state.ts"
import { createDefaultHistoryPort } from "../history/port.ts"
import { buildAttemptRecord } from "../history/serialize.ts"
import { buildIntervalChoices, type IntervalChoice } from "../interval-exercises.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import { getVoiceType, setVoiceType, type VoiceType } from "../voice-ranges.ts"
import { voiceRangeHint } from "./components/voice-picker.tsx"
import type {
  IdentifyMountDeps,
  IdentifyResultView,
  IdentifyTestConfig,
  IdentifyUiState,
} from "./identify-test-types.ts"
import { IdentifyTestView } from "./identify-test-view.tsx"

export type {
  IdentifyMountDeps,
  IdentifyResultView,
  IdentifyTestConfig,
  IdentifyUiState,
} from "./identify-test-types.ts"

function toIdentifyResult(result: ExerciseScreenResultView | null): IdentifyResultView | null {
  if (!result) return null
  if (result.type === "attempt") {
    const detail = result.detail as { selectedLabel?: string } | undefined
    return {
      type: "attempt",
      passed: result.passed,
      selectedLabel: detail?.selectedLabel ?? "?",
      attemptNote: result.attemptNote,
    }
  }
  if (result.type === "summary" || result.type === "audio-error") {
    return result
  }
  return { type: "audio-error" }
}

export function mountIdentifyTest(
  root: HTMLElement,
  config: IdentifyTestConfig,
  deps?: IdentifyMountDeps,
): void {
  const history = deps?.history ?? createDefaultHistoryPort()
  const audio = deps?.audio ?? createDefaultAudioPort()
  const exercisesPerLesson = deps?.exercisesPerLesson ?? EXERCISES_PER_LESSON

  let currentChoices: IntervalChoice[] = []
  let choicesDisabled = false

  const [ui, setUi] = createStore<IdentifyUiState>({
    statusText: config.status.idle,
    chrome: {
      lessonProgress: { visible: true, text: "" },
      actionBar: { mode: "attempting", step: "idle" },
    },
    choices: [],
    showChoices: false,
    choicesDisabled: false,
    resultClassName: "result",
    result: null,
    voice: getVoiceType(),
    voiceRangeHint: voiceRangeHint(getVoiceType()),
    settingsLocked: false,
  })

  function rebuildChoices(exercise: LessonExercise): void {
    if (exercise.type !== "interval") {
      currentChoices = []
      return
    }
    const eligibleIds = exercise.eligibleTagIds ?? [exercise.intervalId]
    currentChoices = buildIntervalChoices(exercise.intervalId, eligibleIds)
  }

  const screenRef: { current: ExerciseScreenState | null } = { current: null }

  function syncUiFromScreen(): void {
    if (!screenRef.current) return
    const snapshot = screenRef.current.getSnapshot()
    const voice = getVoiceType()

    setUi({
      statusText: snapshot.statusText,
      chrome: snapshot.chrome,
      choices: currentChoices,
      showChoices: snapshot.phase === "ready",
      choicesDisabled,
      resultClassName: snapshot.resultClassName,
      result: toIdentifyResult(snapshot.result),
      voice,
      voiceRangeHint: voiceRangeHint(voice),
      settingsLocked: snapshot.settingsLocked,
    })
  }

  screenRef.current = new ExerciseScreenState({
    hooks: {
      prepareExercise: config.prepareExercise,
      ensurePlayback: async () => {
        await audio.ensureReady()
      },
      playReference: config.playReference,
      isPlaybackBusy: () => audio.isPlaying(),
      onAfterPlayback: (exercise) => {
        choicesDisabled = false
        if (currentChoices.length === 0) {
          rebuildChoices(exercise)
        }
      },
      scoreAnswer: (exercise, selectedId) => {
        if (exercise.type !== "interval") {
          return { kind: "error", message: "Missing interval for scoring." }
        }
        const passed = selectedId === exercise.intervalId
        const label = currentChoices.find((c) => c.id === selectedId)?.label ?? String(selectedId)
        return {
          kind: "scored",
          passed,
          scorePayload: { selectedId },
          attemptDetail: { selectedLabel: label },
        }
      },
    },
    statusCopy: config.status,
    responseMode: "select",
    exercisesPerLesson,
    onSnapshotChange: () => syncUiFromScreen(),
    onAttemptScored: ({ lesson, exercise, scorePayload }) => {
      const { selectedId } = scorePayload as { selectedId: string }
      const record = buildAttemptRecord(
        {
          practiceModeId: config.practiceModeId,
          lessonId: lesson.lessonId,
          exerciseIndex: lesson.exerciseIndex,
          showVoicePicker: config.showVoicePicker,
          showIntervalFilters: false,
          showDegreeFilters: false,
        },
        exercise,
        0,
        lesson.passed,
        lesson.attemptNumber,
        selectedId,
      )
      void history.saveAttempt(record)
    },
  })

  const exerciseScreen = screenRef.current

  async function handleChoice(selectedId: string): Promise<void> {
    const snapshot = exerciseScreen.getSnapshot()
    if (snapshot.phase !== "ready" || snapshot.currentExercise?.type !== "interval") {
      return
    }

    choicesDisabled = true
    syncUiFromScreen()
    await exerciseScreen.submitChoice(selectedId)
  }

  function handleVoiceChange(voice: VoiceType): void {
    if (!config.showVoicePicker || voice === getVoiceType()) return
    setVoiceType(voice)
    currentChoices = []
    choicesDisabled = false
    exerciseScreen.resetLesson()
  }

  render(
    () =>
      IdentifyTestView({
        ui,
        title: config.title,
        subtitle: config.subtitle,
        playButtonLabel: config.playButtonLabel,
        showVoicePicker: config.showVoicePicker,
        onPlay: () => {
          audio.unlock()
          void exerciseScreen.play()
        },
        onRetry: () => {
          choicesDisabled = false
          void exerciseScreen.retry()
        },
        onNext: () => {
          choicesDisabled = false
          currentChoices = []
          void exerciseScreen.advance()
        },
        onNextLesson: () => {
          currentChoices = []
          choicesDisabled = false
          exerciseScreen.startNextLesson()
        },
        onVoiceChange: handleVoiceChange,
        onChoice: (choiceId) => {
          void handleChoice(choiceId)
        },
      }),
    root,
  )

  syncUiFromScreen()
}
