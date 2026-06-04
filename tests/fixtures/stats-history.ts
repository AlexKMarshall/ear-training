import type { AttemptRecord } from "../../src/history/types.ts";
import { attempt } from "./attempts.ts";

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
  ];
}
