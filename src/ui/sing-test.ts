import { createStore } from "solid-js/store"
import { render } from "solid-js/web"
import { createDefaultAudioPort } from "../audio/port.ts"
import { createDefaultRecordingPort } from "../audio/recording-port.ts"
import { EXERCISES_PER_LESSON, MIN_VALID_SAMPLES } from "../config.ts"
import type { ExerciseScreenResultView } from "../exercise-screen-state.ts"
import { ExerciseScreenState } from "../exercise-screen-state.ts"
import { createDefaultHistoryPort } from "../history/port.ts"
import { buildAttemptRecord } from "../history/serialize.ts"
import type { LessonExercise } from "../lesson-exercise.ts"
import type { ScoreResult } from "../pitch/score.ts"
import { scoreFromSamples } from "../pitch/score.ts"
import { getScaleDegreeById } from "../scale-degree-config.ts"
import { getVoiceType, setVoiceType, type VoiceType } from "../voice-ranges.ts"
import { voiceRangeHint } from "./components/voice-picker.tsx"
import type {
  SingMountDeps,
  SingResultView,
  SingTestConfig,
  SingUiState,
} from "./sing-test-types.ts"
import { SingTestView } from "./sing-test-view.tsx"

export type { LessonExercise } from "../lesson-exercise.ts"
export type {
  SingMountDeps,
  SingResultView,
  SingTestConfig,
  SingUiState,
} from "./sing-test-types.ts"

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

export function mountSingTest(
  root: HTMLElement,
  config: SingTestConfig,
  deps?: SingMountDeps,
): void {
  const history = deps?.history ?? createDefaultHistoryPort()
  const audio = deps?.audio ?? createDefaultAudioPort()
  const recording = deps?.recording ?? createDefaultRecordingPort()
  const exercisesPerLesson = deps?.exercisesPerLesson ?? EXERCISES_PER_LESSON

  let livePitchText = "Listening…"

  const [ui, setUi] = createStore<SingUiState>({
    statusText: config.status.idle,
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

  function exercisePromptText(exercise: LessonExercise | null): string | null {
    if (!exercise) return null
    if (config.exercisePrompt) {
      return config.exercisePrompt(exercise)
    }
    if (exercise.type === "scale-degree") {
      const label = getScaleDegreeById(exercise.degreeId)?.label ?? exercise.degreeId
      return label ? `Sing the ${label}` : null
    }
    return null
  }

  const screenRef: { current: ExerciseScreenState | null } = { current: null }

  function syncUiFromScreen(): void {
    if (!screenRef.current) return
    const snapshot = screenRef.current.getSnapshot()
    const voice = getVoiceType()
    const targetName = snapshot.currentExercise?.target.name ?? "?"

    let questionPrompt = ""
    let showQuestionPrompt = false
    const promptPhases = config.exercisePromptFromDraw
      ? (["idle", "playing", "ready", "recording"] as const)
      : (["ready"] as const)
    if ((promptPhases as readonly string[]).includes(snapshot.phase)) {
      const prompt = exercisePromptText(snapshot.currentExercise)
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
      prepareExercise: config.prepareExercise,
      ensurePlayback: async () => {
        await audio.ensureReady()
      },
      playReference: config.playReference,
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
      scoreAnswer: (exercise, samplesHz) => {
        if (samplesHz.length < MIN_VALID_SAMPLES) {
          return {
            kind: "error",
            message: `Not enough clear pitch detected (${samplesHz.length} frames, need ${MIN_VALID_SAMPLES}). Hold a steady note closer to the mic.`,
          }
        }

        const outcome = scoreFromSamples(samplesHz, exercise.target.hz)
        if ("error" in outcome) {
          return { kind: "error", message: outcome.error }
        }

        return {
          kind: "scored",
          passed: outcome.passed,
          scorePayload: { centsOff: outcome.centsOff },
          attemptDetail: outcome,
        }
      },
    },
    statusCopy: config.status,
    responseMode: "sing",
    exercisesPerLesson,
    onSnapshotChange: () => syncUiFromScreen(),
    onAttemptScored: ({ lesson, exercise, scorePayload }) => {
      const { centsOff } = scorePayload as { centsOff: number }
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
        centsOff,
        lesson.passed,
        lesson.attemptNumber,
      )
      void history.saveAttempt(record)
    },
    onLessonReset: config.onLessonReset,
    prepareExerciseOnIdle: config.exercisePromptFromDraw,
  })

  const exerciseScreen = screenRef.current

  function stopRecordingStream(): void {
    recording.stopStream()
  }

  function handleVoiceChange(voice: VoiceType): void {
    if (!config.showVoicePicker || voice === getVoiceType()) return
    setVoiceType(voice)
    stopRecordingStream()
    exerciseScreen.resetLesson()
  }

  render(
    () =>
      SingTestView({
        ui,
        title: config.title,
        subtitle: config.subtitle,
        lessonBanner: config.lessonBanner,
        playButtonLabel: config.playButtonLabel,
        showVoicePicker: config.showVoicePicker,
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
