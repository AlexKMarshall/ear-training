import { MIN_QUESTIONS } from "../../src/curriculum/unlock.ts";
import type { AttemptRecord } from "../../src/history/types.ts";

export function attempt(
  overrides: Partial<AttemptRecord> &
    Pick<AttemptRecord, "passed" | "attemptNumber" | "centsOff">,
): AttemptRecord {
  return {
    exerciseId: "single-note",
    timestamp: 1,
    targetMidi: 60,
    targetHz: 261.63,
    targetName: "C4",
    roundId: "round-1",
    questionIndex: 0,
    ...overrides,
  };
}

/** Ten distinct questions, all passed on first try. */
export function passingSingleNoteHistory(): AttemptRecord[] {
  return Array.from({ length: MIN_QUESTIONS }, (_, i) =>
    attempt({
      exerciseId: "single-note",
      passed: true,
      attemptNumber: 1,
      centsOff: 0,
      questionIndex: i,
      roundId: `round-${i}`,
    }),
  );
}

/** Passing history through every Level 2 path exercise. */
export function passingLevel2History(): AttemptRecord[] {
  const records: AttemptRecord[] = [...passingSingleNoteHistory()];
  for (const exerciseId of [
    "interval-melodic-sing",
    "interval-harmonic-sing",
    "interval-melodic-id",
    "interval-harmonic-id",
  ] as const) {
    records.push(
      ...Array.from({ length: MIN_QUESTIONS }, (_, i) =>
        attempt({
          exerciseId,
          passed: true,
          attemptNumber: 1,
          centsOff: 0,
          questionIndex: i,
          roundId: `${exerciseId}-${i}`,
        }),
      ),
    );
  }
  return records;
}
