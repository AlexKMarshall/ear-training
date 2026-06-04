import type { CurriculumStep } from "../../src/curriculum/steps.ts";
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

/** Passing history for one curriculum step (tier tagged when provided). */
export function passingStepHistory(step: CurriculumStep): AttemptRecord[] {
  return Array.from({ length: MIN_QUESTIONS }, (_, i) =>
    attempt({
      exerciseId: step.exerciseId,
      contentTierId: step.contentTierId,
      passed: true,
      attemptNumber: 1,
      centsOff: 0,
      questionIndex: i,
      roundId: `${step.exerciseId}-${step.contentTierId}-${i}`,
    }),
  );
}

/** Level 2 at 2a plus melodic sing at 2b (identify 2b still locked). */
export function passingMelodicSing2bHistory(): AttemptRecord[] {
  return [
    ...passingLevel2History(),
    ...passingStepHistory({
      exerciseId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    }),
  ];
}

/** Melodic identification at interval-2b complete; harmonic 2b steps not yet done. */
export function passingThroughMelodic2bHistory(): AttemptRecord[] {
  return [
    ...passingMelodicSing2bHistory(),
    ...passingStepHistory({
      exerciseId: "interval-melodic-id",
      contentTierId: "interval-2b",
    }),
  ];
}

/** Full interval tier 2b (all four presentation modes); scale-degree step unlockable. */
export function passingThroughHarmonic2bHistory(): AttemptRecord[] {
  return [
    ...passingThroughMelodic2bHistory(),
    ...passingStepHistory({
      exerciseId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    }),
    ...passingStepHistory({
      exerciseId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    }),
  ];
}
