import type { InversionId } from "../chord-inversions.ts";

export type ExerciseId = "single-note" | "chord-middle";

export const EXERCISE_LABELS: Record<ExerciseId, string> = {
  "single-note": "Sing a single note",
  "chord-middle": "Sing the middle note of a chord",
};

/** One scored mic attempt, persisted for stats and future drill weighting. */
export interface AttemptRecord {
  id?: number;
  exerciseId: ExerciseId;
  timestamp: number;
  centsOff: number;
  passed: boolean;
  /** 1-based attempt within the current question (max 3). */
  attemptNumber: number;
  targetMidi: number;
  targetHz: number;
  targetName: string;
  /** Voiced chord tones when the reference was a chord. */
  chordNotes?: readonly { midi: number; name: string }[];
  chordTypeId?: string;
  inversionId?: InversionId;
  voiceType?: string;
  /** User filter settings at attempt time (chord-middle). */
  activeChordTypeIds?: string[];
  activeInversionIds?: string[];
  roundId: string;
  /** Position in the round (0-based) when this attempt was scored. */
  questionIndex: number;
}

export type AttemptInput = Omit<AttemptRecord, "id">;
