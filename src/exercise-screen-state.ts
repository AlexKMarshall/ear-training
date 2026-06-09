import { EXERCISES_PER_LESSON, MAX_ATTEMPTS_PER_EXERCISE } from "./config.ts"
import { type LessonSummary, percentOf, summarizeLesson } from "./lesson.ts"
import type { LessonExercise } from "./lesson-exercise.ts"
import { type AttemptScoredContext, LessonRun, type LessonRunSnapshot } from "./lesson-run.ts"

export type ExerciseScreenPhase =
  | "idle"
  | "playing"
  | "ready"
  | "recording"
  | "result"
  | "lessonSummary"

export type ExerciseScreenResultView =
  | {
      type: "attempt"
      passed: boolean
      attemptNote: string | null
      detail?: unknown
    }
  | {
      type: "summary"
      summary: LessonSummary
      correctPct: number
      firstTryPct: number
      retryPct: number
      wrongPct: number
    }
  | { type: "scoring-error"; detail: string }
  | { type: "audio-error" }

export type LessonProgressState = { visible: true; text: string } | { visible: false }

export type ActionBarState =
  | {
      mode: "attempting"
      step: "idle" | "playing" | "ready" | "recording"
      record?: "start" | "done"
    }
  | { mode: "result"; action: "retry" }
  | { mode: "result"; action: "next"; nextLabel: string }
  | { mode: "result"; action: "none" }
  | { mode: "lesson-summary" }

export type ExerciseChromeSnapshot = {
  lessonProgress: LessonProgressState
  actionBar: ActionBarState
}

export interface ExerciseScreenStateSnapshot {
  phase: ExerciseScreenPhase
  statusText: string
  settingsLocked: boolean
  chrome: ExerciseChromeSnapshot
  resultClassName: string
  result: ExerciseScreenResultView | null
  currentExercise: LessonExercise | null
  lesson: LessonRunSnapshot
}

interface BeginRecordingOptions {
  exercise: LessonExercise
  onPitch: (displayText: string) => void
  onComplete: (samplesHz: number[]) => void
  onError: (message: string) => void
}

export type ScoreAnswerResult =
  | {
      kind: "scored"
      passed: boolean
      scorePayload: unknown
      attemptDetail?: unknown
    }
  | { kind: "error"; message: string }

interface ExerciseScreenStateHooksBase {
  prepareExercise(): LessonExercise
  ensurePlayback(): Promise<void>
  requiresPlayback?(exercise: LessonExercise): boolean
  playReference(exercise: LessonExercise): Promise<void>
  /** Called after reference playback, before entering ready (e.g. rebuild choice pool). */
  onAfterPlayback?(exercise: LessonExercise): void | Promise<void>
  isPlaybackBusy?(): boolean
}

export interface SingExerciseScreenStateHooks extends ExerciseScreenStateHooksBase {
  scoreAnswer(
    exercise: LessonExercise,
    samplesHz: number[],
  ): ScoreAnswerResult | Promise<ScoreAnswerResult>
  beginRecording(options: BeginRecordingOptions): Promise<{ stop: () => void } | undefined>
}

export interface SelectExerciseScreenStateHooks extends ExerciseScreenStateHooksBase {
  scoreAnswer(
    exercise: LessonExercise,
    selectedId: string,
  ): ScoreAnswerResult | Promise<ScoreAnswerResult>
}

export interface ExerciseScreenStatusCopy {
  idle: string
  playing: string
  ready: string
  recording?: string
  pass: string
  fail: string
  failExhausted?: string
}

export interface AttemptScoredEnrichedContext {
  lesson: AttemptScoredContext
  exercise: LessonExercise
  scorePayload: unknown
}

export type ResponseMode = "sing" | "select"

interface ExerciseScreenStateOptionsBase {
  statusCopy: ExerciseScreenStatusCopy
  exercisesPerLesson?: number
  maxAttemptsPerExercise?: number
  onSnapshotChange: (snapshot: ExerciseScreenStateSnapshot) => void
  onAttemptScored: (context: AttemptScoredEnrichedContext) => void
  onLessonReset?: () => void
  createLessonId?: () => string
  /** Draw the question in idle before the first Play so prompts can show early (named-interval reproduction). */
  prepareExerciseOnIdle?: boolean
}

export type ExerciseScreenStateOptions =
  | (ExerciseScreenStateOptionsBase & {
      responseMode: "sing"
      hooks: SingExerciseScreenStateHooks
    })
  | (ExerciseScreenStateOptionsBase & {
      responseMode: "select"
      hooks: SelectExerciseScreenStateHooks
    })

function nextStepButtonLabel(isLastExerciseInLesson: boolean): string {
  return isLastExerciseInLesson ? "Finish lesson" : "Next exercise"
}

function buildAttemptNote(passed: boolean, triesLeft: number, nextLabel: string): string | null {
  if (passed) return null
  if (triesLeft > 0) {
    return `${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left on this exercise.`
  }
  return `No tries left — tap ${nextLabel} when you are ready.`
}

function buildExerciseChrome(
  phase: ExerciseScreenPhase,
  lesson: LessonRunSnapshot,
  responseMode: ResponseMode,
  exercisesPerLesson: number,
): ExerciseChromeSnapshot {
  const inLessonSummary = phase === "lessonSummary"
  const lessonProgress: LessonProgressState = inLessonSummary
    ? { visible: false }
    : {
        visible: true,
        text: `Lesson — exercise ${lesson.exerciseNumber} of ${exercisesPerLesson}`,
      }

  let actionBar: ActionBarState
  if (inLessonSummary) {
    actionBar = { mode: "lesson-summary" }
  } else if (phase === "result") {
    if (lesson.canRetry) {
      actionBar = { mode: "result", action: "retry" }
    } else if (lesson.canAdvance) {
      actionBar = {
        mode: "result",
        action: "next",
        nextLabel: nextStepButtonLabel(lesson.isLastExerciseInLesson),
      }
    } else {
      actionBar = { mode: "result", action: "none" }
    }
  } else if (phase === "idle" || phase === "playing") {
    actionBar = { mode: "attempting", step: phase }
  } else if (phase === "ready") {
    actionBar =
      responseMode === "sing"
        ? { mode: "attempting", step: "ready", record: "start" }
        : { mode: "attempting", step: "ready" }
  } else {
    actionBar =
      responseMode === "sing"
        ? { mode: "attempting", step: "recording", record: "done" }
        : { mode: "attempting", step: "recording" }
  }

  return { lessonProgress, actionBar }
}

export class ExerciseScreenState {
  private phase: ExerciseScreenPhase = "idle"
  private currentExercise: LessonExercise | null = null
  private resultView: ExerciseScreenResultView | null = null
  private recordingSession: { stop: () => void } | null = null
  private readonly lessonRun: LessonRun
  private readonly hooks: SingExerciseScreenStateHooks | SelectExerciseScreenStateHooks
  private readonly statusCopy: ExerciseScreenStatusCopy
  private readonly responseMode: ResponseMode
  private readonly exercisesPerLesson: number
  private readonly maxAttemptsPerExercise: number
  private readonly onSnapshotChange: (snapshot: ExerciseScreenStateSnapshot) => void
  private readonly onAttemptScored: (context: AttemptScoredEnrichedContext) => void
  private readonly onLessonReset?: () => void
  private readonly prepareExerciseOnIdle: boolean

  constructor(options: ExerciseScreenStateOptions) {
    this.hooks = options.hooks
    this.statusCopy = options.statusCopy
    this.responseMode = options.responseMode
    this.exercisesPerLesson = options.exercisesPerLesson ?? EXERCISES_PER_LESSON
    this.maxAttemptsPerExercise = options.maxAttemptsPerExercise ?? MAX_ATTEMPTS_PER_EXERCISE
    this.onSnapshotChange = options.onSnapshotChange
    this.onAttemptScored = options.onAttemptScored
    this.onLessonReset = options.onLessonReset
    this.prepareExerciseOnIdle = options.prepareExerciseOnIdle ?? false

    this.lessonRun = new LessonRun({
      exercisesPerLesson: this.exercisesPerLesson,
      maxAttemptsPerExercise: this.maxAttemptsPerExercise,
      createLessonId: options.createLessonId,
    })

    if (this.prepareExerciseOnIdle) {
      this.drawExercise()
    } else {
      this.notify()
    }
  }

  getSnapshot(): ExerciseScreenStateSnapshot {
    const lesson = this.lessonRun.getSnapshot()
    const nextLabel = nextStepButtonLabel(lesson.isLastExerciseInLesson)

    let statusText = this.statusCopy.idle
    switch (this.phase) {
      case "lessonSummary":
        statusText = "Lesson finished — review your score, then start the next lesson."
        break
      case "idle":
        statusText = this.statusCopy.idle
        break
      case "playing":
        statusText = this.statusCopy.playing
        break
      case "ready":
        statusText = this.statusCopy.ready
        break
      case "recording":
        statusText = this.statusCopy.recording ?? this.statusCopy.ready
        break
      case "result": {
        const triesLeft = this.maxAttemptsPerExercise - lesson.scoredAttemptsOnCurrent
        const onLastQuestion = lesson.isLastExerciseInLesson
        if (this.resultView?.type === "attempt") {
          statusText = this.resultView.passed
            ? onLastQuestion
              ? `Correct — tap ${nextLabel} when you are ready.`
              : this.statusCopy.pass
            : triesLeft > 0
              ? this.statusCopy.fail
              : onLastQuestion
                ? `Out of tries — tap ${nextLabel} to see your lesson score.`
                : (this.statusCopy.failExhausted ?? this.statusCopy.fail)
        } else if (this.resultView?.type === "scoring-error") {
          statusText = "Something went wrong."
        }
        break
      }
    }

    const settingsLocked =
      this.phase === "playing" ||
      this.phase === "lessonSummary" ||
      (this.responseMode === "sing" && this.phase === "recording") ||
      (this.responseMode === "select" && this.phase === "result")

    let resultClassName = "result"
    if (this.resultView?.type === "attempt") {
      resultClassName = this.resultView.passed ? "result result-pass" : "result result-fail"
    } else if (this.resultView?.type === "summary") {
      resultClassName = "result lesson-summary"
    } else if (
      this.resultView?.type === "scoring-error" ||
      this.resultView?.type === "audio-error"
    ) {
      resultClassName = "result result-fail"
    }

    return {
      phase: this.phase,
      statusText,
      settingsLocked,
      chrome: buildExerciseChrome(this.phase, lesson, this.responseMode, this.exercisesPerLesson),
      resultClassName,
      result: this.resultView,
      currentExercise: this.currentExercise,
      lesson,
    }
  }

  private setPhase(next: ExerciseScreenPhase): void {
    this.phase = next
    this.notify()
  }

  private notify(): void {
    this.onSnapshotChange(this.getSnapshot())
  }

  private drawExercise(): void {
    if (this.currentExercise) {
      return
    }
    this.currentExercise = this.hooks.prepareExercise()
    this.lessonRun.ensureCurrentExercise()
    this.notify()
  }

  async play(): Promise<void> {
    if (this.hooks.isPlaybackBusy?.()) return
    if (this.phase === "lessonSummary") return

    try {
      await this.hooks.ensurePlayback()
      if (!this.currentExercise) {
        this.currentExercise = this.hooks.prepareExercise()
        this.lessonRun.ensureCurrentExercise()
      }

      const exercise = this.currentExercise
      if (!exercise) return

      const skipPlayback = this.hooks.requiresPlayback?.(exercise) === false
      if (!skipPlayback) {
        this.setPhase("playing")
        await this.hooks.playReference(exercise)
      }

      await this.hooks.onAfterPlayback?.(exercise)
      this.setPhase("ready")
    } catch {
      this.resultView = { type: "audio-error" }
      this.currentExercise = null
      this.setPhase("idle")
    }
  }

  async submitChoice(selectedId: string): Promise<void> {
    if (this.phase !== "ready" || this.responseMode !== "select") return

    const exercise = this.currentExercise
    if (!exercise || (exercise.type !== "interval" && exercise.type !== "chord")) return

    const outcome = await (this.hooks as SelectExerciseScreenStateHooks).scoreAnswer(
      exercise,
      selectedId,
    )
    if (outcome.kind === "error") {
      this.showScoringError(outcome.message)
      return
    }

    this.applyScoredAttempt(outcome)
  }

  async toggleRecording(): Promise<void> {
    if (this.responseMode !== "sing") return
    const singHooks = this.hooks as SingExerciseScreenStateHooks

    if (this.phase === "recording") {
      this.recordingSession?.stop()
      this.recordingSession = null
      return
    }

    if (this.phase !== "ready" || !this.currentExercise) return

    try {
      await this.hooks.ensurePlayback()
      this.setPhase("recording")

      const session = await singHooks.beginRecording({
        exercise: this.currentExercise,
        onPitch: () => {
          // Adapter may update live pitch presentation locally.
        },
        onComplete: (samples) => {
          this.recordingSession = null
          void this.finishRecording(samples)
        },
        onError: (message) => {
          this.recordingSession = null
          this.showScoringError(message)
        },
      })

      if (session && typeof session.stop === "function") {
        this.recordingSession = session
      }
    } catch (err) {
      this.showScoringError(err instanceof Error ? err.message : "Microphone error.")
    }
  }

  private async finishRecording(samplesHz: number[]): Promise<void> {
    if (!this.currentExercise) {
      this.showScoringError("No reference — press Play first.")
      return
    }

    const outcome = await (this.hooks as SingExerciseScreenStateHooks).scoreAnswer(
      this.currentExercise,
      samplesHz,
    )
    if (outcome.kind === "error") {
      this.showScoringError(outcome.message)
      return
    }

    this.applyScoredAttempt(outcome)
  }

  private applyScoredAttempt(outcome: Extract<ScoreAnswerResult, { kind: "scored" }>): void {
    if (!this.currentExercise) return

    const lessonContext = this.lessonRun.recordScore(outcome.passed)
    this.onAttemptScored({
      lesson: lessonContext,
      exercise: this.currentExercise,
      scorePayload: outcome.scorePayload,
    })

    const lesson = this.lessonRun.getSnapshot()
    const triesLeft = this.maxAttemptsPerExercise - lesson.scoredAttemptsOnCurrent
    const nextLabel = nextStepButtonLabel(lesson.isLastExerciseInLesson)

    this.resultView = {
      type: "attempt",
      passed: outcome.passed,
      attemptNote: buildAttemptNote(outcome.passed, triesLeft, nextLabel),
      detail: outcome.attemptDetail,
    }
    this.setPhase("result")
  }

  private showScoringError(message: string): void {
    this.resultView = { type: "scoring-error", detail: message }
    this.setPhase("result")
  }

  private showLessonSummary(): void {
    const summary = summarizeLesson(this.lessonRun.getSnapshot().results)
    this.resultView = {
      type: "summary",
      summary,
      correctPct: percentOf(summary.correctCount, summary.total),
      firstTryPct: percentOf(summary.firstTryCount, summary.total),
      retryPct: percentOf(summary.retryCount, summary.total),
      wrongPct: percentOf(summary.wrongCount, summary.total),
    }
    this.setPhase("lessonSummary")
  }

  async retry(): Promise<void> {
    this.recordingSession?.stop()
    this.recordingSession = null
    this.lessonRun.retryCurrentExercise()
    this.resultView = null
    await this.play()
  }

  async advance(): Promise<void> {
    this.recordingSession?.stop()
    this.recordingSession = null
    this.lessonRun.advanceAfterResult(this.currentExercise ?? undefined)

    if (this.lessonRun.getSnapshot().isLessonComplete) {
      this.showLessonSummary()
      return
    }

    this.currentExercise = null
    this.resultView = null
    this.setPhase("idle")
    if (this.prepareExerciseOnIdle) {
      this.drawExercise()
    }
    await this.play()
  }

  resetLesson(): void {
    this.recordingSession?.stop()
    this.recordingSession = null
    this.lessonRun.reset()
    this.currentExercise = null
    this.resultView = null
    this.onLessonReset?.()
    this.setPhase("idle")
    if (this.prepareExerciseOnIdle) {
      this.drawExercise()
    }
  }

  startNextLesson(): void {
    this.resetLesson()
  }
}
