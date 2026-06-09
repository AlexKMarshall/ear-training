import { createStore } from "solid-js/store"
import { render } from "solid-js/web"
import { createDefaultAudioPort } from "../audio/port.ts"
import { createDefaultRecordingPort } from "../audio/recording-port.ts"
import { EXERCISES_PER_LESSON } from "../config.ts"
import type { SingExerciseDefinition } from "../exercise-definition.ts"
import type { ExerciseScreenResultView } from "../exercise-screen-state.ts"
import { ExerciseScreenState } from "../exercise-screen-state.ts"
import { createDefaultHistoryPort } from "../history/port.ts"
import { buildAttemptRecord } from "../history/serialize.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import type { ScoreResult } from "../pitch/score.ts"
import { getScaleDegreeById } from "../scale-degree-config.ts"
import { getVoiceType, setVoiceType, type VoiceType } from "../voice-ranges.ts"
import { voiceRangeHint } from "./components/voice-picker.tsx"
import type { SingMountDeps, SingResultView, SingUiState } from "./sing-test-types.ts"
import { SingTestView } from "./sing-test-view.tsx"

export interface ExerciseMountDeps extends SingMountDeps {}

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
    },
    onLessonReset: definition.onLessonReset,
    prepareExerciseOnIdle: definition.exercisePromptFromDraw,
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

export function mountExercise(
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
