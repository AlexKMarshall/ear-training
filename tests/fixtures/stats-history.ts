import type { AttemptRecord } from "../../src/history/types.ts"
import { attempt } from "./attempts.ts"

/** Chord-sing attempts with voicing positions for stats breakdown UI tests. */
export function chordVoicingWeaknessHistory(): AttemptRecord[] {
  return [
    attempt({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-second",
      passed: true,
      attemptNumber: 1,
      centsOff: 5,
      voicingPositionId: "bottom",
      exerciseIndex: 0,
    }),
    attempt({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-second",
      passed: false,
      attemptNumber: 1,
      centsOff: 40,
      voicingPositionId: "top",
      exerciseIndex: 1,
      lessonId: "lesson-1",
    }),
  ]
}

/** Interval sing with two tags for weakness breakdown UI tests. */
export function intervalWeaknessHistory(): AttemptRecord[] {
  return [
    attempt({
      practiceModeId: "interval-melodic-sing",
      passed: true,
      attemptNumber: 1,
      centsOff: 5,
      intervalId: "perfect-fifth",
      exerciseIndex: 0,
    }),
    attempt({
      practiceModeId: "interval-melodic-sing",
      passed: false,
      attemptNumber: 1,
      centsOff: 40,
      intervalId: "perfect-fourth",
      exerciseIndex: 1,
      lessonId: "lesson-1",
    }),
  ]
}
