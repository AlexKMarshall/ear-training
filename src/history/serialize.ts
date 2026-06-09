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
  const chordNotes = exercise.chord?.notes.map((n) => ({
    midi: n.midi,
    name: n.name,
  }))

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
    chordTypeId: exercise.chordTypeId,
    inversionId: exercise.inversionId,
    voicingPositionId: exercise.voicingPositionId,
    voiceType: context.showVoicePicker ? getVoiceType() : undefined,
    intervalId: exercise.intervalId,
    intervalSemitones: exercise.interval?.semitones,
    presentation: exercise.interval?.presentation,
    referenceMidi: exercise.interval?.lower.midi,
    activeIntervalIds: undefined,
    contentTierId: exercise.contentTierId,
    eligibleTagIds: exercise.eligibleTagIds,
    selectedIntervalId,
    degreeId: exercise.degreeId,
    tonicMidi: exercise.scaleDegree?.tonic.midi,
    activeDegreeIds: context.showDegreeFilters ? getSelectedScaleDegreeIds() : undefined,
    lessonId: context.lessonId,
    exerciseIndex: context.exerciseIndex,
  }
}
