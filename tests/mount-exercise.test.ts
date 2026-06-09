import { describe, expect, it, vi } from "vitest"
import type { AudioPort } from "../src/audio/port.ts"
import { createTestRecordingPort } from "../src/audio/recording-port.ts"
import type { SingExerciseDefinition } from "../src/exercise-definition.ts"
import { createMemoryHistoryPort } from "../src/history/port.ts"
import { createSingExerciseOrchestrator } from "../src/ui/mount-exercise.ts"
import { singleNoteExerciseDefinition } from "../src/ui/tests.ts"

const fixedTarget = { midi: 60, hz: 261.63, name: "C4" }

function createTestAudioPort(): AudioPort {
  return {
    unlock: vi.fn(() => ({}) as AudioContext),
    ensureReady: vi.fn(async () => ({}) as AudioContext),
    isPlaying: vi.fn(() => false),
  }
}

function createTestDefinition(
  overrides: Partial<SingExerciseDefinition> = {},
): SingExerciseDefinition {
  return {
    ...singleNoteExerciseDefinition,
    prepareExercise: () => ({ type: "single-note", target: fixedTarget }),
    playReference: vi.fn(async () => {}),
    scoreAnswer: vi.fn((_exercise, samplesHz) => ({
      kind: "scored" as const,
      passed: samplesHz.length >= 16,
      scorePayload: { centsOff: 5 },
    })),
    ...overrides,
  }
}

describe("mountExercise sing orchestrator", () => {
  it("starts in idle before play", () => {
    const definition = createTestDefinition()
    const { screen } = createSingExerciseOrchestrator(definition)

    const snapshot = screen.getSnapshot()
    expect(snapshot.phase).toBe("idle")
    expect(snapshot.currentExercise).toBeNull()
    expect(snapshot.statusText).toBe(definition.status.idle)
  })

  it("transitions idle → playing → ready on play", async () => {
    const definition = createTestDefinition()
    const { screen } = createSingExerciseOrchestrator(definition, {
      audio: createTestAudioPort(),
    })

    await screen.play()

    expect(screen.getSnapshot().phase).toBe("ready")
    expect(definition.playReference).toHaveBeenCalledWith({
      type: "single-note",
      target: fixedTarget,
    })
  })

  it("persists attempt on scored recording via history port", async () => {
    const history = createMemoryHistoryPort()
    const definition = createTestDefinition()
    const passSamples = Array(20).fill(fixedTarget.hz)
    const { screen } = createSingExerciseOrchestrator(definition, {
      history,
      audio: createTestAudioPort(),
      recording: createTestRecordingPort({ samplesHz: passSamples }),
    })

    await screen.play()
    await screen.toggleRecording()
    await screen.toggleRecording()

    expect(screen.getSnapshot().phase).toBe("result")
    const records = await history.getAllAttempts()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      practiceModeId: "single-note",
      passed: true,
      targetMidi: fixedTarget.midi,
    })
  })
})
