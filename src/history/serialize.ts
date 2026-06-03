import { getActiveInversions } from "../chord-inversion-preference.ts";
import { getSelectedChordTypeIds } from "../chord-type-preference.ts";
import { getSelectedIntervalIds } from "../interval-preference.ts";
import type { SingTestQuestion } from "../sing-test-question.ts";
import { getVoiceType } from "../voice-ranges.ts";
import type { AttemptInput, ExerciseId } from "./types.ts";

export interface AttemptContext {
  exerciseId: ExerciseId;
  roundId: string;
  questionIndex: number;
  showVoicePicker: boolean;
  showChordFilters: boolean;
  showIntervalFilters: boolean;
}

export function buildAttemptRecord(
  context: AttemptContext,
  question: SingTestQuestion,
  centsOff: number,
  passed: boolean,
  attemptNumber: number,
  selectedIntervalId?: string,
): AttemptInput {
  const chordNotes = question.chord?.notes.map((n) => ({
    midi: n.midi,
    name: n.name,
  }));

  return {
    exerciseId: context.exerciseId,
    timestamp: Date.now(),
    centsOff,
    passed,
    attemptNumber,
    targetMidi: question.target.midi,
    targetHz: question.target.hz,
    targetName: question.target.name,
    chordNotes,
    chordTypeId: question.chordTypeId,
    inversionId: question.inversionId,
    voiceType: context.showVoicePicker ? getVoiceType() : undefined,
    activeChordTypeIds: context.showChordFilters
      ? getSelectedChordTypeIds()
      : undefined,
    activeInversionIds: context.showChordFilters
      ? getActiveInversions().map((inv) => inv.id)
      : undefined,
    intervalId: question.intervalId,
    intervalSemitones: question.interval?.semitones,
    presentation: question.interval?.presentation,
    referenceMidi: question.interval?.lower.midi,
    activeIntervalIds: context.showIntervalFilters
      ? getSelectedIntervalIds()
      : undefined,
    selectedIntervalId,
    roundId: context.roundId,
    questionIndex: context.questionIndex,
  };
}
