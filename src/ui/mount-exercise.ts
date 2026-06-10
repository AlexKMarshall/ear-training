import { createStore } from "solid-js/store"
import { render } from "solid-js/web"
import { createDefaultAudioPort } from "../audio/port.ts"
import { createDefaultRecordingPort } from "../audio/recording-port.ts"
import type { ExerciseChoice } from "../chord-identify-choices.ts"
import { EXERCISES_PER_LESSON } from "../config.ts"
import type {
  ExerciseDefinition,
  SelectExerciseDefinition,
  SingExerciseDefinition,
} from "../exercise-definition.ts"
import { isSingExerciseDefinition } from "../exercise-definition.ts"
import type { ExerciseScreenResultView } from "../exercise-screen-state.ts"
import { ExerciseScreenState } from "../exercise-screen-state.ts"
import { createDefaultHistoryPort } from "../history/port.ts"
import { buildAttemptRecord } from "../history/serialize.ts"
import type { SessionHistoryCache } from "../history/session-cache.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import type { LessonRunInitialState, LessonRunSnapshot } from "../lesson-run.ts"
import type { ScoreResult } from "../pitch/score.ts"
import { getScaleDegreeById } from "../scale-degree-config.ts"
import { getVoiceType, setVoiceType, type VoiceType } from "../voice-ranges.ts"
import { voiceRangeHint } from "./components/voice-picker.tsx"
import type {
  IdentifyMountDeps,
  IdentifyResultView,
  IdentifyUiState,
} from "./identify-test-types.ts"
import { IdentifyTestView } from "./identify-test-view.tsx"
import type { SingMountDeps, SingResultView, SingUiState } from "./sing-test-types.ts"
import { SingTestView } from "./sing-test-view.tsx"

export interface ExerciseMountDeps extends SingMountDeps, IdentifyMountDeps {
  sessionHistory?: SessionHistoryCache
  initialLessonRunState?: LessonRunInitialState
  onLessonRunSnapshot?: (snapshot: LessonRunSnapshot) => void
}

function toSingResult(
  result: ExerciseScreenResultView | null,
  targetName: string,
): SingResultView | null {
  if (!result) return null
  if (result.type === "attempt") {
    const detail = result.detail as ScoreResult | undefined
    return {
      type: "attempt",
      passed: result.passed,
      message: detail?.message ?? "",
      detectedHz: detail?.detectedHz ?? 0,
      targetHz: detail?.targetHz ?? 0,
      targetName,
      attemptNote: result.attemptNote,
    }
  }
  if (result.type === "summary" || result.type === "audio-error") {
    return result
  }
  if (result.type === "scoring-error") {
    return result
  }
  return { type: "audio-error" }
}

function exercisePromptText(
  definition: SingExerciseDefinition,
  exercise: LessonExercise | null,
): string | null {
  if (!exercise) return null
  if (definition.exercisePrompt) {
    return definition.exercisePrompt(exercise)
  }
  if (exercise.type === "scale-degree") {
    const label = getScaleDegreeById(exercise.degreeId)?.label ?? exercise.degreeId
    return label ? `Sing the ${label}` : null
  }
  return null
}

export interface SingExerciseOrchestrator {
  ui: SingUiState
  screen: ExerciseScreenState
  syncUiFromScreen: () => void
  stopRecordingStream: () => void
  handleVoiceChange: (voice: VoiceType) => void
}

export function createSingExerciseOrchestrator(
  definition: SingExerciseDefinition,
  deps: ExerciseMountDeps = {},
): SingExerciseOrchestrator {
  const history = deps.history ?? createDefaultHistoryPort()
  const audio = deps.audio ?? createDefaultAudioPort()
  const recording = deps.recording ?? createDefaultRecordingPort()
  const exercisesPerLesson = deps.exercisesPerLesson ?? EXERCISES_PER_LESSON

  let livePitchText = "Listening…"

  const [ui, setUi] = createStore<SingUiState>({
    statusText: definition.status.idle,
    chrome: {
      lessonProgress: { visible: true, text: "" },
      actionBar: { mode: "attempting", step: "idle" },
    },
    questionPrompt: "",
    showQuestionPrompt: false,
    livePitchText: "Listening…",
    showLivePitch: false,
    resultClassName: "result",
    result: null,
    voice: getVoiceType(),
    voiceRangeHint: voiceRangeHint(getVoiceType()),
    settingsLocked: false,
  })

  const screenRef: { current: ExerciseScreenState | null } = { current: null }

  function syncUiFromScreen(): void {
    if (!screenRef.current) return
    const snapshot = screenRef.current.getSnapshot()
    const voice = getVoiceType()
    const targetName = snapshot.currentExercise?.target.name ?? "?"

    let questionPrompt = ""
    let showQuestionPrompt = false
    const promptPhases = definition.exercisePromptFromDraw
      ? (["idle", "playing", "ready", "recording"] as const)
      : (["ready"] as const)
    if ((promptPhases as readonly string[]).includes(snapshot.phase)) {
      const prompt = exercisePromptText(definition, snapshot.currentExercise)
      if (prompt) {
        showQuestionPrompt = true
        questionPrompt = prompt
      }
    }

    setUi({
      statusText: snapshot.statusText,
      chrome: snapshot.chrome,
      questionPrompt,
      showQuestionPrompt,
      livePitchText,
      showLivePitch: snapshot.phase === "recording",
      resultClassName: snapshot.resultClassName,
      result: toSingResult(snapshot.result, targetName),
      voice,
      voiceRangeHint: voiceRangeHint(voice),
      settingsLocked: snapshot.settingsLocked,
    })
  }

  screenRef.current = new ExerciseScreenState({
    hooks: {
      prepareExercise: definition.prepareExercise,
      ensurePlayback: async () => {
        await audio.ensureReady()
      },
      playReference: definition.playReference,
      isPlaybackBusy: () => audio.isPlaying(),
      beginRecording: async ({ exercise, onPitch, onComplete, onError }) => {
        livePitchText = "Listening…"
        syncUiFromScreen()

        return recording.start({
          targetHz: exercise.target.hz,
          onPitch: (hz, clarity) => {
            livePitchText = `~${hz.toFixed(0)} Hz (clarity ${(clarity * 100).toFixed(0)}%)`
            onPitch(livePitchText)
            syncUiFromScreen()
          },
          onComplete,
          onError,
        })
      },
      scoreAnswer: definition.scoreAnswer,
    },
    statusCopy: definition.status,
    responseMode: "sing",
    exercisesPerLesson,
    onSnapshotChange: () => syncUiFromScreen(),
    onAttemptScored: ({ lesson, exercise, scorePayload }) => {
      const { centsOff } = scorePayload as { centsOff: number }
      const record = buildAttemptRecord(
        {
          practiceModeId: definition.practiceModeId,
          lessonId: lesson.lessonId,
          exerciseIndex: lesson.exerciseIndex,
          showVoicePicker: definition.showVoicePicker,
          showIntervalFilters: definition.showIntervalFilters ?? false,
          showDegreeFilters: definition.showDegreeFilters ?? false,
        },
        exercise,
        centsOff,
        lesson.passed,
        lesson.attemptNumber,
      )
      void history.saveAttempt(record)
      if (screenRef.current) {
        deps.onLessonRunSnapshot?.(screenRef.current.getSnapshot().lesson)
      }
    },
    onLessonReset: definition.onLessonReset,
    prepareExerciseOnIdle: definition.exercisePromptFromDraw,
    initialLessonRunState: deps.initialLessonRunState,
  })

  const exerciseScreen = screenRef.current

  function stopRecordingStream(): void {
    recording.stopStream()
  }

  function handleVoiceChange(voice: VoiceType): void {
    if (!definition.showVoicePicker || voice === getVoiceType()) return
    setVoiceType(voice)
    stopRecordingStream()
    exerciseScreen.resetLesson()
  }

  return {
    ui,
    screen: exerciseScreen,
    syncUiFromScreen,
    stopRecordingStream,
    handleVoiceChange,
  }
}

function toIdentifyResult(
  result: ExerciseScreenResultView | null,
  failRetryDetail: string,
): IdentifyResultView | null {
  if (!result) return null
  if (result.type === "attempt") {
    const detail = result.detail as { selectedLabel?: string } | undefined
    return {
      type: "attempt",
      passed: result.passed,
      selectedLabel: detail?.selectedLabel ?? "?",
      attemptNote: result.attemptNote,
      failRetryDetail,
    }
  }
  if (result.type === "summary" || result.type === "audio-error") {
    return result
  }
  return { type: "audio-error" }
}

function isSelectableExercise(
  exercise: LessonExercise | null,
): exercise is Extract<LessonExercise, { type: "interval" } | { type: "chord" }> {
  return exercise?.type === "interval" || exercise?.type === "chord"
}

export interface SelectExerciseOrchestrator {
  ui: IdentifyUiState
  screen: ExerciseScreenState
  syncUiFromScreen: () => void
  handleVoiceChange: (voice: VoiceType) => void
  handleChoice: (selectedId: string) => Promise<void>
  enableChoicesForRetry: () => void
  resetChoiceState: () => void
}

export function createSelectExerciseOrchestrator(
  definition: SelectExerciseDefinition,
  deps: ExerciseMountDeps = {},
): SelectExerciseOrchestrator {
  const history = deps.history ?? createDefaultHistoryPort()
  const audio = deps.audio ?? createDefaultAudioPort()
  const exercisesPerLesson = deps.exercisesPerLesson ?? EXERCISES_PER_LESSON
  const failRetryDetail =
    definition.failRetryDetail ?? "That wasn't right — tap Try again to listen and pick again."

  let currentChoices: ExerciseChoice[] = []
  let choicesDisabled = false

  const [ui, setUi] = createStore<IdentifyUiState>({
    statusText: definition.status.idle,
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
    currentChoices = definition.buildChoices(exercise)
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
      result: toIdentifyResult(snapshot.result, failRetryDetail),
      voice,
      voiceRangeHint: voiceRangeHint(voice),
      settingsLocked: snapshot.settingsLocked,
    })
  }

  screenRef.current = new ExerciseScreenState({
    hooks: {
      prepareExercise: definition.prepareExercise,
      ensurePlayback: async () => {
        await audio.ensureReady()
      },
      playReference: definition.playReference,
      isPlaybackBusy: () => audio.isPlaying(),
      onAfterPlayback: (exercise) => {
        choicesDisabled = false
        if (currentChoices.length === 0) {
          rebuildChoices(exercise)
        }
      },
      scoreAnswer: definition.scoreAnswer,
    },
    statusCopy: definition.status,
    responseMode: "select",
    exercisesPerLesson,
    onSnapshotChange: () => syncUiFromScreen(),
    onAttemptScored: ({ lesson, exercise, scorePayload }) => {
      const { selectedId } = scorePayload as { selectedId: string }
      const record = buildAttemptRecord(
        {
          practiceModeId: definition.practiceModeId,
          lessonId: lesson.lessonId,
          exerciseIndex: lesson.exerciseIndex,
          showVoicePicker: definition.showVoicePicker,
          showIntervalFilters: definition.showIntervalFilters ?? false,
          showDegreeFilters: definition.showDegreeFilters ?? false,
        },
        exercise,
        0,
        lesson.passed,
        lesson.attemptNumber,
        selectedId,
      )
      void history.saveAttempt(record)
      if (screenRef.current) {
        deps.onLessonRunSnapshot?.(screenRef.current.getSnapshot().lesson)
      }
    },
    onLessonReset: definition.onLessonReset,
    initialLessonRunState: deps.initialLessonRunState,
  })

  const exerciseScreen = screenRef.current

  async function handleChoice(selectedId: string): Promise<void> {
    const snapshot = exerciseScreen.getSnapshot()
    if (snapshot.phase !== "ready" || !isSelectableExercise(snapshot.currentExercise)) {
      return
    }

    choicesDisabled = true
    syncUiFromScreen()
    await exerciseScreen.submitChoice(selectedId)
  }

  function enableChoicesForRetry(): void {
    choicesDisabled = false
    syncUiFromScreen()
  }

  function resetChoiceState(): void {
    currentChoices = []
    choicesDisabled = false
  }

  function handleVoiceChange(voice: VoiceType): void {
    if (!definition.showVoicePicker || voice === getVoiceType()) return
    setVoiceType(voice)
    resetChoiceState()
    exerciseScreen.resetLesson()
  }

  return {
    ui,
    screen: exerciseScreen,
    syncUiFromScreen,
    handleVoiceChange,
    handleChoice,
    enableChoicesForRetry,
    resetChoiceState,
  }
}

function mountSingExercise(
  root: HTMLElement,
  definition: SingExerciseDefinition,
  deps?: ExerciseMountDeps,
): void {
  const history = deps?.history ?? createDefaultHistoryPort()
  const audio = deps?.audio ?? createDefaultAudioPort()
  const orchestrator = createSingExerciseOrchestrator(definition, { ...deps, history, audio })
  const {
    ui,
    screen: exerciseScreen,
    syncUiFromScreen,
    stopRecordingStream,
    handleVoiceChange,
  } = orchestrator

  render(
    () =>
      SingTestView({
        ui,
        title: definition.title,
        subtitle: definition.subtitle,
        lessonBanner: definition.lessonBanner,
        playButtonLabel: definition.playButtonLabel,
        showVoicePicker: definition.showVoicePicker,
        onPlay: () => {
          audio.unlock()
          void exerciseScreen.play()
        },
        onRecord: () => {
          audio.unlock()
          void exerciseScreen.toggleRecording()
        },
        onRetry: () => {
          stopRecordingStream()
          void exerciseScreen.retry()
        },
        onNext: () => {
          stopRecordingStream()
          void exerciseScreen.advance()
        },
        onNextLesson: () => {
          stopRecordingStream()
          exerciseScreen.startNextLesson()
        },
        onVoiceChange: handleVoiceChange,
      }),
    root,
  )

  syncUiFromScreen()
}

function mountSelectExercise(
  root: HTMLElement,
  definition: SelectExerciseDefinition,
  deps?: ExerciseMountDeps,
): void {
  const audio = deps?.audio ?? createDefaultAudioPort()
  const {
    ui,
    screen: exerciseScreen,
    syncUiFromScreen,
    handleVoiceChange,
    handleChoice,
    enableChoicesForRetry,
    resetChoiceState,
  } = createSelectExerciseOrchestrator(definition, deps)

  render(
    () =>
      IdentifyTestView({
        ui,
        title: definition.title,
        subtitle: definition.subtitle,
        lessonBanner: definition.lessonBanner,
        playButtonLabel: definition.playButtonLabel,
        showVoicePicker: definition.showVoicePicker,
        onPlay: () => {
          audio.unlock()
          void exerciseScreen.play()
        },
        onRetry: () => {
          enableChoicesForRetry()
          void exerciseScreen.retry()
        },
        onNext: () => {
          resetChoiceState()
          void exerciseScreen.advance()
        },
        onNextLesson: () => {
          resetChoiceState()
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

export function mountExercise(
  root: HTMLElement,
  definition: ExerciseDefinition,
  deps?: ExerciseMountDeps,
): void {
  if (isSingExerciseDefinition(definition)) {
    mountSingExercise(root, definition, deps)
    return
  }
  mountSelectExercise(root, definition, deps)
}
