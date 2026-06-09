import type { InversionId } from "./chord-inversions.ts"
import type { ChordExercise } from "./chords.ts"
import type { ContentTierId } from "./curriculum/curriculum-lessons.ts"
import type { IntervalExercise } from "./interval-exercises.ts"
import type { TargetNote } from "./notes.ts"
import type { ScaleDegreeExercise } from "./scale-degree-exercises.ts"
import type { VoicingPositionId } from "./voicing-position.ts"

export interface LessonExercise {
  target: TargetNote
  /** Present when the reference is a chord rather than a single tone. */
  chord?: ChordExercise
  chordTypeId?: string
  inversionId?: InversionId
  voicingPositionId?: VoicingPositionId
  interval?: IntervalExercise
  intervalId?: string
  contentTierId?: ContentTierId
  eligibleTagIds?: readonly string[]
  scaleDegree?: ScaleDegreeExercise
  degreeId?: string
}
