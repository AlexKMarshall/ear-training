import type { CurriculumLesson } from "../../src/curriculum/curriculum-lessons.ts"
import { MIN_EXERCISES_FOR_UNLOCK } from "../../src/curriculum/unlock.ts"
import type { AttemptRecord } from "../../src/history/types.ts"

export function attempt(
  overrides: Partial<AttemptRecord> & Pick<AttemptRecord, "passed" | "attemptNumber" | "centsOff">,
): AttemptRecord {
  return {
    practiceModeId: "single-note",
    timestamp: 1,
    targetMidi: 60,
    targetHz: 261.63,
    targetName: "C4",
    lessonId: "lesson-1",
    exerciseIndex: 0,
    ...overrides,
  }
}

/** Ten distinct lesson exercises, all passed on first try. */
export function passingSingleNoteHistory(): AttemptRecord[] {
  return Array.from({ length: MIN_EXERCISES_FOR_UNLOCK }, (_, i) =>
    attempt({
      practiceModeId: "single-note",
      passed: true,
      attemptNumber: 1,
      centsOff: 0,
      exerciseIndex: i,
      lessonId: `lesson-${i}`,
    }),
  )
}

/** Interval 2a through harmonic sing (chord major root unlockable). */
export function passingThroughHarmonicSing2aHistory(): AttemptRecord[] {
  const records: AttemptRecord[] = [...passingSingleNoteHistory()]
  for (const practiceModeId of [
    "interval-melodic-sing",
    "interval-named-sing",
    "interval-melodic-id",
    "interval-harmonic-sing",
  ] as const) {
    records.push(
      ...passingStepHistory({
        practiceModeId,
        contentTierId: "interval-2a",
      }),
    )
  }
  return records
}

/** Interval 2a through harmonic identification (chord minor root unlockable). */
export function passingThroughHarmonicId2aHistory(): AttemptRecord[] {
  return [
    ...passingThroughHarmonicSing2aHistory(),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-root",
    }),
    ...passingStepHistory({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2a",
    }),
  ]
}

/** Passing history through interval tier 2a and chord minor root. */
export function passingLevel2History(): AttemptRecord[] {
  return [
    ...passingThroughHarmonicId2aHistory(),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-root",
    }),
  ]
}

/** Chord quality identification at root complete; intro scale degrees unlockable. */
export function passingThroughChordQualityRootHistory(): AttemptRecord[] {
  return [
    ...passingLevel2History(),
    ...passingStepHistory({
      practiceModeId: "chord-quality-id",
      contentTierId: "chord-quality-root",
    }),
  ]
}

/** Chord quality identification at 1st inversion complete; melodic identify 2b unlockable. */
export function passingThroughChordQualityFirstHistory(): AttemptRecord[] {
  return [
    ...passingMelodicSing2bHistory(),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-first",
    }),
    ...passingStepHistory({
      practiceModeId: "interval-named-sing",
      contentTierId: "interval-2b",
    }),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-first",
    }),
    ...passingStepHistory({
      practiceModeId: "chord-quality-id",
      contentTierId: "chord-quality-first",
    }),
  ]
}

/** Passing history for one curriculum step (tier tagged when provided). */
export function passingStepHistory(step: CurriculumLesson): AttemptRecord[] {
  return Array.from({ length: MIN_EXERCISES_FOR_UNLOCK }, (_, i) =>
    attempt({
      practiceModeId: step.practiceModeId,
      contentTierId: step.contentTierId,
      passed: true,
      attemptNumber: 1,
      centsOff: 0,
      exerciseIndex: i,
      lessonId: `${step.practiceModeId}-${step.contentTierId}-${i}`,
    }),
  )
}

/** Intro scale degrees complete; interval 2b block unlockable. */
export function passingIntroScaleDegreeHistory(): AttemptRecord[] {
  return [
    ...passingThroughChordQualityRootHistory(),
    ...passingStepHistory({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-intro",
    }),
  ]
}

/** Level 2a plus intro scale degrees (melodic sing at 2b still locked). */
export function passingMelodicSing2bHistory(): AttemptRecord[] {
  return [
    ...passingIntroScaleDegreeHistory(),
    ...passingStepHistory({
      practiceModeId: "interval-melodic-sing",
      contentTierId: "interval-2b",
    }),
  ]
}

/** Named-interval reproduction at interval-2b complete; chord quality first not yet done. */
export function passingThroughMelodic2bHistory(): AttemptRecord[] {
  return [
    ...passingMelodicSing2bHistory(),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-first",
    }),
    ...passingStepHistory({
      practiceModeId: "interval-named-sing",
      contentTierId: "interval-2b",
    }),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-first",
    }),
  ]
}

/** Melodic identification at interval-2b complete; harmonic sing 2b not yet done. */
export function passingThroughMelodicId2bHistory(): AttemptRecord[] {
  return [
    ...passingThroughChordQualityFirstHistory(),
    ...passingStepHistory({
      practiceModeId: "interval-melodic-id",
      contentTierId: "interval-2b",
    }),
  ]
}

/** Full interval tier 2b (all five presentation modes); major diatonic scale degrees unlockable. */
export function passingThroughHarmonic2bHistory(): AttemptRecord[] {
  return [
    ...passingThroughMelodicId2bHistory(),
    ...passingStepHistory({
      practiceModeId: "interval-harmonic-sing",
      contentTierId: "interval-2b",
    }),
    ...passingStepHistory({
      practiceModeId: "interval-harmonic-id",
      contentTierId: "interval-2b",
    }),
  ]
}

/** Major diatonic scale degrees complete; chord major second unlockable. */
export function passingMajorDiatonicScaleDegreeHistory(): AttemptRecord[] {
  return [
    ...passingThroughHarmonic2bHistory(),
    ...passingStepHistory({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-major-diatonic",
    }),
  ]
}

/** Chord major second complete; minor diatonic scale degrees unlockable. */
export function passingChordMajorSecondHistory(): AttemptRecord[] {
  return [
    ...passingMajorDiatonicScaleDegreeHistory(),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-major-second",
    }),
  ]
}

/** Minor diatonic scale degrees complete; chord minor second unlockable. */
function passingMinorDiatonicScaleDegreeHistory(): AttemptRecord[] {
  return [
    ...passingChordMajorSecondHistory(),
    ...passingStepHistory({
      practiceModeId: "scale-degree-sing",
      contentTierId: "degree-minor-diatonic",
    }),
  ]
}

/** Chord minor second complete; guided path complete. */
function passingChordMinorSecondHistory(): AttemptRecord[] {
  return [
    ...passingMinorDiatonicScaleDegreeHistory(),
    ...passingStepHistory({
      practiceModeId: "chord-sing",
      contentTierId: "chord-minor-second",
    }),
  ]
}

/** Every shipped curriculum step meets unlock thresholds. */
export function passingFullGuidedPathHistory(): AttemptRecord[] {
  return passingChordMinorSecondHistory()
}
