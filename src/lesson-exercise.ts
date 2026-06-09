import type { InversionId } from "./chord-inversions.ts"
import type { ChordExercise } from "./chords.ts"
import type { ContentTierId } from "./curriculum/curriculum-lessons.ts"
import type { IntervalExercise } from "./interval-exercises.ts"
import type { TargetNote } from "./notes.ts"
import type { ScaleDegreeExercise } from "./scale-degree-exercises.ts"
import type { VoicingPositionId } from "./voicing-position.ts"

interface LessonExerciseBase {
  target: TargetNote
  contentTierId?: ContentTierId
  eligibleTagIds?: readonly string[]
}

interface SingleNoteLessonExercise extends LessonExerciseBase {
  type: "single-note"
}

export interface IntervalLessonExercise extends LessonExerciseBase {
  type: "interval"
  interval: IntervalExercise
  intervalId: string
}

export interface ScaleDegreeLessonExercise extends LessonExerciseBase {
  type: "scale-degree"
  scaleDegree: ScaleDegreeExercise
  degreeId: string
}

export interface ChordLessonExercise extends LessonExerciseBase {
  type: "chord"
  chord: ChordExercise
  chordTypeId: string
  inversionId: InversionId
  voicingPositionId: VoicingPositionId
}

export type LessonExercise =
  | SingleNoteLessonExercise
  | IntervalLessonExercise
  | ScaleDegreeLessonExercise
  | ChordLessonExercise
