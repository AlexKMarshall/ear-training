import type { LessonExercise } from "../lesson-exercise.ts"
import { getSelectedScaleDegreeIds } from "../scale-degree-preference.ts"
import { getVoiceType } from "../voice-ranges.ts"
import type { AttemptInput, PracticeModeId } from "./types.ts"

export interface AttemptContext {
  practiceModeId: PracticeModeId
  lessonId: string
  exerciseIndex: number
  showVoicePicker: boolean
  showIntervalFilters: boolean
  showDegreeFilters: boolean
}

export function buildAttemptRecord(
  context: AttemptContext,
  exercise: LessonExercise,
  centsOff: number,
  passed: boolean,
  attemptNumber: number,
  selectedIntervalId?: string,
): AttemptInput {
  const chordNotes =
    exercise.type === "chord"
      ? exercise.chord.notes.map((n) => ({
          midi: n.midi,
          name: n.name,
        }))
      : undefined

  const intervalFields =
    exercise.type === "interval"
      ? {
          intervalId: exercise.intervalId,
          intervalSemitones: exercise.interval.semitones,
          presentation: exercise.interval.presentation,
          referenceMidi: exercise.interval.lower.midi,
        }
      : {
          intervalId: undefined,
          intervalSemitones: undefined,
          presentation: undefined,
          referenceMidi: undefined,
        }

  const degreeFields =
    exercise.type === "scale-degree"
      ? {
          degreeId: exercise.degreeId,
          tonicMidi: exercise.scaleDegree.tonic.midi,
        }
      : {
          degreeId: undefined,
          tonicMidi: undefined,
        }

  return {
    practiceModeId: context.practiceModeId,
    timestamp: Date.now(),
    centsOff,
    passed,
    attemptNumber,
    targetMidi: exercise.target.midi,
    targetHz: exercise.target.hz,
    targetName: exercise.target.name,
    chordNotes,
    chordTypeId: exercise.type === "chord" ? exercise.chordTypeId : undefined,
    inversionId: exercise.type === "chord" ? exercise.inversionId : undefined,
    voicingPositionId: exercise.type === "chord" ? exercise.voicingPositionId : undefined,
    voiceType: context.showVoicePicker ? getVoiceType() : undefined,
    ...intervalFields,
    activeIntervalIds: undefined,
    contentTierId: exercise.contentTierId,
    eligibleTagIds: exercise.eligibleTagIds,
    selectedIntervalId,
    ...degreeFields,
    activeDegreeIds: context.showDegreeFilters ? getSelectedScaleDegreeIds() : undefined,
    lessonId: context.lessonId,
    exerciseIndex: context.exerciseIndex,
  }
}
