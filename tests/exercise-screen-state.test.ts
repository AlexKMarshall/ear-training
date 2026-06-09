import { describe, expect, it, vi } from "vitest"
import {
  type ActionBarState,
  type AttemptScoredEnrichedContext,
  type ExerciseChromeSnapshot,
  type ExerciseScreenPhase,
  ExerciseScreenState,
  type ExerciseScreenStateSnapshot,
  type SelectExerciseScreenStateHooks,
  type SingExerciseScreenStateHooks,
} from "../src/exercise-screen-state.ts"
import type { LessonExercise } from "../src/lesson-exercise.ts"

const sampleExercise: LessonExercise = {
  type: "interval",
  target: { midi: 60, hz: 261.63, name: "C4" },
  intervalId: "P5",
  interval: {
    intervalId: "P5",
    semitones: 7,
    presentation: "melodic",
    lower: { midi: 53, hz: 220, name: "A3" },
    upper: { midi: 60, hz: 261.63, name: "C4" },
  },
}

const statusCopy = {
  idle: "idle copy",
  playing: "playing copy",
  ready: "ready copy",
  recording: "recording copy",
  pass: "pass copy",
  fail: "fail copy",
  failExhausted: "fail exhausted copy",
}

function createSelectState(
  hookOverrides: Partial<SelectExerciseScreenStateHooks> = {},
  options: {
    exercisesPerLesson?: number
    onAttemptScored?: (context: AttemptScoredEnrichedContext) => void
    onSnapshotChange?: (snapshot: ExerciseScreenStateSnapshot) => void
  } = {},
) {
  const snapshots: ExerciseScreenStateSnapshot[] = []
  const onSnapshotChange =
    options.onSnapshotChange ??
    (vi.fn((snapshot: ExerciseScreenStateSnapshot) => {
      snapshots.push(snapshot)
    }) as (snapshot: ExerciseScreenStateSnapshot) => void)
  const onAttemptScored = (options.onAttemptScored ?? vi.fn()) as (
    context: AttemptScoredEnrichedContext,
  ) => void

  const hooks: SelectExerciseScreenStateHooks = {
    prepareExercise: vi.fn(() => sampleExercise),
    ensurePlayback: vi.fn(async () => {}),
    playReference: vi.fn(async () => {}),
    scoreAnswer: vi.fn((_exercise, selectedId) => ({
      kind: "scored" as const,
      passed: selectedId === "P5",
      scorePayload: { selectedId },
      attemptDetail: { selectedLabel: selectedId },
    })),
    ...hookOverrides,
  }

  const state = new ExerciseScreenState({
    hooks,
    statusCopy,
    responseMode: "select",
    exercisesPerLesson: options.exercisesPerLesson,
    onSnapshotChange,
    onAttemptScored,
    createLessonId: () => "lesson-test",
  })

  return { state, hooks, snapshots, onAttemptScored, onSnapshotChange }
}

function createSingState(hookOverrides: Partial<SingExerciseScreenStateHooks> = {}) {
  const snapshots: ExerciseScreenStateSnapshot[] = []
  const onAttemptScored = vi.fn()
  const hooks: SingExerciseScreenStateHooks = {
    prepareExercise: () => sampleExercise,
    ensurePlayback: vi.fn(async () => {}),
    playReference: vi.fn(async () => {}),
    scoreAnswer: vi.fn((_exercise, samplesHz) => ({
      kind: "scored" as const,
      passed: samplesHz.length >= 16,
      scorePayload: { centsOff: 5 },
    })),
    beginRecording: vi.fn(async ({ onComplete }) => {
      onComplete([200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215])
      return { stop: vi.fn() }
    }),
    ...hookOverrides,
  }

  const state = new ExerciseScreenState({
    hooks,
    statusCopy,
    responseMode: "sing",
    onSnapshotChange: (snapshot) => snapshots.push(snapshot),
    onAttemptScored,
    createLessonId: () => "lesson-sing",
  })

  return { state, hooks, snapshots, onAttemptScored }
}

function expectAttemptingStep(
  actionBar: ActionBarState,
  step: "idle" | "playing" | "ready" | "recording",
  record?: "start" | "done",
): void {
  expect(actionBar).toEqual(
    record ? { mode: "attempting", step, record } : { mode: "attempting", step },
  )
}

function expectLessonProgressVisible(chrome: ExerciseChromeSnapshot, exerciseNumber: number): void {
  expect(chrome.lessonProgress).toEqual({
    visible: true,
    text: `Lesson — exercise ${exerciseNumber} of 10`,
  })
}

describe("ExerciseScreenState", () => {
  it("exposes idle snapshot before play", () => {
    const { state } = createSelectState()
    const snapshot = state.getSnapshot()
    expect(snapshot).toMatchObject({
      phase: "idle",
      statusText: statusCopy.idle,
      currentExercise: null,
      lesson: {
        lessonId: "lesson-test",
        currentExerciseIndex: null,
        exerciseNumber: 1,
      },
    })
    expectAttemptingStep(snapshot.chrome.actionBar, "idle")
    expectLessonProgressVisible(snapshot.chrome, 1)
  })

  it("transitions idle → playing → ready on first play", async () => {
    const { state, hooks } = createSelectState()
    await state.play()

    expect(hooks.prepareExercise).toHaveBeenCalledTimes(1)
    expect(hooks.ensurePlayback).toHaveBeenCalledTimes(1)
    expect(hooks.playReference).toHaveBeenCalledWith(sampleExercise)
    const snapshot = state.getSnapshot()
    expect(snapshot).toMatchObject({
      phase: "ready",
      statusText: statusCopy.ready,
      currentExercise: sampleExercise,
      lesson: { currentExerciseIndex: 0 },
    })
    expectAttemptingStep(snapshot.chrome.actionBar, "ready")
  })

  it("skips playing when requiresPlayback returns false", async () => {
    const { state, hooks } = createSelectState({
      requiresPlayback: () => false,
    })

    await state.play()

    expect(hooks.playReference).not.toHaveBeenCalled()
    expect(state.getSnapshot().phase).toBe("ready")
  })

  it("scores a select choice and fires enriched attempt scored", async () => {
    const onAttemptScored = vi.fn()
    const { state, hooks } = createSelectState({}, { onAttemptScored })

    await state.play()
    await state.submitChoice("P5")

    expect(hooks.scoreAnswer).toHaveBeenCalledWith(sampleExercise, "P5")
    expect(onAttemptScored).toHaveBeenCalledTimes(1)
    expect(onAttemptScored.mock.calls[0]?.[0]).toMatchObject({
      exercise: sampleExercise,
      scorePayload: { selectedId: "P5" },
      lesson: {
        lessonId: "lesson-test",
        exerciseIndex: 0,
        passed: true,
        attemptNumber: 1,
      },
    })
    expect(state.getSnapshot()).toMatchObject({
      phase: "result",
      result: {
        type: "attempt",
        passed: true,
        detail: { selectedLabel: "P5" },
      },
    })
    expect(state.getSnapshot().chrome.actionBar).toEqual({
      mode: "result",
      action: "next",
      nextLabel: "Next exercise",
    })
  })

  it("shows scoring error when select scoreAnswer returns error", async () => {
    const { state } = createSelectState({
      scoreAnswer: () => ({ kind: "error", message: "bad choice" }),
    })

    await state.play()
    await state.submitChoice("P5")

    expect(state.getSnapshot()).toMatchObject({
      phase: "result",
      result: { type: "scoring-error", detail: "bad choice" },
    })
  })

  it("shows scoring error when sing scoreAnswer returns error", async () => {
    const { state } = createSingState({
      scoreAnswer: () => ({ kind: "error", message: "not enough pitch" }),
    })

    await state.play()
    await state.toggleRecording()

    expect(state.getSnapshot()).toMatchObject({
      phase: "result",
      result: { type: "scoring-error", detail: "not enough pitch" },
    })
  })

  it("shows retry action after a failed select attempt with tries remaining", async () => {
    const { state } = createSelectState()
    await state.play()
    await state.submitChoice("M3")

    expect(state.getSnapshot().chrome.actionBar).toEqual({
      mode: "result",
      action: "retry",
    })
  })

  it("transitions sing recording via toggleRecording", async () => {
    const { state, hooks, onAttemptScored } = createSingState()
    const expectedSamples = [
      200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215,
    ]

    await state.play()
    await state.toggleRecording()

    expect(hooks.scoreAnswer).toHaveBeenCalledWith(sampleExercise, expectedSamples)
    expect(state.getSnapshot()).toMatchObject({
      phase: "result",
      result: { type: "attempt", passed: true },
    })
    expect(onAttemptScored).toHaveBeenCalledWith(
      expect.objectContaining({
        scorePayload: { centsOff: 5 },
      }),
    )
  })

  it("retry replays without duplicate recordScore before a new attempt", async () => {
    const onAttemptScored = vi.fn()
    const { state } = createSelectState({}, { onAttemptScored })

    await state.play()
    await state.submitChoice("M3")
    expect(onAttemptScored).toHaveBeenCalledTimes(1)

    await state.retry()
    expect(state.getSnapshot().phase).toBe("ready")
    await state.submitChoice("P5")

    expect(onAttemptScored).toHaveBeenCalledTimes(2)
    expect(state.getSnapshot().lesson.scoredAttemptsOnCurrent).toBe(2)
  })

  it("advance mid-lesson clears exercise and auto-plays next", async () => {
    const playReference = vi.fn(async () => {})
    const { state } = createSelectState({ playReference })

    await state.play()
    await state.submitChoice("P5")
    await state.advance()

    expect(state.getSnapshot()).toMatchObject({
      phase: "ready",
      lesson: {
        exerciseNumber: 2,
        results: [{ outcome: "firstTry" }],
      },
    })
    expect(playReference).toHaveBeenCalledTimes(2)
  })

  it("advance on last exercise shows lesson summary", async () => {
    const { state } = createSelectState({}, { exercisesPerLesson: 1 })

    await state.play()
    await state.submitChoice("P5")
    await state.advance()

    const snapshot = state.getSnapshot()
    expect(snapshot).toMatchObject({
      phase: "lessonSummary",
      result: {
        type: "summary",
        summary: { total: 1, correctCount: 1 },
      },
    })
    expect(snapshot.chrome.actionBar).toEqual({ mode: "lesson-summary" })
    expect(snapshot.chrome.lessonProgress).toEqual({ visible: false })
  })

  it("resetLesson clears lesson and returns to idle", async () => {
    const onLessonReset = vi.fn()
    const onSnapshotChange = vi.fn()

    const stateWithReset = new ExerciseScreenState({
      hooks: {
        prepareExercise: () => sampleExercise,
        ensurePlayback: vi.fn(async () => {}),
        playReference: vi.fn(async () => {}),
        scoreAnswer: (_exercise, selectedId) => ({
          kind: "scored",
          passed: selectedId === "P5",
          scorePayload: { selectedId },
        }),
      },
      statusCopy,
      responseMode: "select",
      onSnapshotChange,
      onAttemptScored: vi.fn(),
      onLessonReset,
      createLessonId: () => "lesson-reset",
    })

    await stateWithReset.play()
    await stateWithReset.submitChoice("P5")
    stateWithReset.resetLesson()

    expect(onLessonReset).toHaveBeenCalledTimes(1)
    expect(stateWithReset.getSnapshot()).toMatchObject({
      phase: "idle",
      currentExercise: null,
      result: null,
      lesson: { results: [], exerciseNumber: 1 },
    })
  })

  it("maps playback failure to audio error and idle", async () => {
    const { state } = createSelectState({
      playReference: vi.fn(async () => {
        throw new Error("audio failed")
      }),
    })

    await state.play()

    const snapshot = state.getSnapshot()
    expect(snapshot).toMatchObject({
      phase: "idle",
      result: { type: "audio-error" },
      currentExercise: null,
    })
    expectAttemptingStep(snapshot.chrome.actionBar, "idle")
  })

  it("locks settings on result for select response mode", async () => {
    const { state } = createSelectState()
    await state.play()
    await state.submitChoice("P5")

    expect(state.getSnapshot().settingsLocked).toBe(true)
  })

  it("does not redraw on play when exercise was already drawn in idle", async () => {
    let calls = 0
    const first: LessonExercise = {
      ...sampleExercise,
      intervalId: "first",
      interval: { ...sampleExercise.interval, intervalId: "first" },
    }
    const second: LessonExercise = {
      ...sampleExercise,
      intervalId: "second",
      interval: { ...sampleExercise.interval, intervalId: "second" },
    }
    const prepareExercise = vi.fn(() => (calls++ === 0 ? first : second))

    const state = new ExerciseScreenState({
      hooks: {
        prepareExercise,
        ensurePlayback: vi.fn(async () => {}),
        playReference: vi.fn(async () => {}),
        scoreAnswer: (_exercise, samplesHz) => ({
          kind: "scored",
          passed: false,
          scorePayload: { centsOff: 50, frameCount: samplesHz.length },
        }),
        beginRecording: vi.fn(async ({ onComplete }) => {
          onComplete([
            200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215,
          ])
          return { stop: vi.fn() }
        }),
      },
      statusCopy,
      responseMode: "sing",
      prepareExerciseOnIdle: true,
      onSnapshotChange: vi.fn(),
      onAttemptScored: vi.fn(),
    })

    expect(prepareExercise).toHaveBeenCalledTimes(1)
    const drawnExercise = state.getSnapshot().currentExercise
    expect(drawnExercise?.type).toBe("interval")
    if (drawnExercise?.type !== "interval") throw new Error("expected interval exercise")
    expect(drawnExercise.intervalId).toBe("first")

    await state.play()
    expect(prepareExercise).toHaveBeenCalledTimes(1)

    await state.toggleRecording()
    expect(state.getSnapshot().phase).toBe("result")

    await state.retry()
    expect(state.getSnapshot().phase).toBe("ready")
    expect(prepareExercise).toHaveBeenCalledTimes(1)
    const retriedExercise = state.getSnapshot().currentExercise
    if (retriedExercise?.type !== "interval") throw new Error("expected interval exercise")
    expect(retriedExercise.intervalId).toBe("first")
  })

  it("projects sing record on ready and recording steps only", async () => {
    const beginRecording = vi.fn(
      ({ onPitch }: { onPitch: (text: string) => void }) =>
        new Promise<{ stop: () => void }>((resolve) => {
          onPitch("~260 Hz")
          resolve({ stop: vi.fn() })
        }),
    )
    const { state } = createSingState({ beginRecording })

    await state.play()
    expectAttemptingStep(state.getSnapshot().chrome.actionBar, "ready", "start")

    await state.toggleRecording()
    const recordingSnapshot = state.getSnapshot()
    expect(recordingSnapshot.phase).toBe("recording")
    expectAttemptingStep(recordingSnapshot.chrome.actionBar, "recording", "done")
  })

  it("startNextLesson resets lesson state", async () => {
    const { state } = createSelectState({}, { exercisesPerLesson: 1 })
    await state.play()
    await state.submitChoice("P5")
    await state.advance()
    state.startNextLesson()

    expect(state.getSnapshot()).toMatchObject({
      phase: "idle",
      lesson: { results: [], isLessonComplete: false },
    })
  })
})

describe("ExerciseScreenState chrome projection", () => {
  const phaseCases: Array<{
    phase: ExerciseScreenPhase
    responseMode: "select" | "sing"
    setup: (state: ExerciseScreenState) => Promise<void>
    expectedActionBar: ActionBarState
    lessonProgressVisible: boolean
  }> = [
    {
      phase: "idle",
      responseMode: "select",
      setup: async () => {},
      expectedActionBar: { mode: "attempting", step: "idle" },
      lessonProgressVisible: true,
    },
    {
      phase: "ready",
      responseMode: "sing",
      setup: async (state) => {
        await state.play()
      },
      expectedActionBar: { mode: "attempting", step: "ready", record: "start" },
      lessonProgressVisible: true,
    },
    {
      phase: "result",
      responseMode: "select",
      setup: async (state) => {
        await state.play()
        await state.submitChoice("M3")
      },
      expectedActionBar: { mode: "result", action: "retry" },
      lessonProgressVisible: true,
    },
  ]

  it.each(phaseCases)("maps $phase ($responseMode) to action bar $expectedActionBar.mode", async ({
    responseMode,
    setup,
    expectedActionBar,
    lessonProgressVisible,
  }) => {
    const { state } = responseMode === "sing" ? createSingState() : createSelectState()
    await setup(state)
    const { chrome } = state.getSnapshot()
    expect(chrome.actionBar).toEqual(expectedActionBar)
    expect(chrome.lessonProgress.visible).toBe(lessonProgressVisible)
  })
})
