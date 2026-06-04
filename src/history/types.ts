import type { ContentTierId } from "../curriculum/steps.ts";
import type { InversionId } from "../chord-inversions.ts";

export type ExerciseId =
  | "single-note"
  | "chord-middle"
  | "interval-melodic-sing"
  | "interval-harmonic-sing"
  | "interval-melodic-id"
  | "interval-harmonic-id"
  | "scale-degree-sing";

export const EXERCISE_LABELS: Record<ExerciseId, string> = {
  "single-note": "Sing a single note",
  "chord-middle": "Sing the middle note of a chord",
  "interval-melodic-sing": "Sing melodic intervals",
  "interval-harmonic-sing": "Sing harmonic intervals",
  "interval-melodic-id": "Identify melodic intervals",
  "interval-harmonic-id": "Identify harmonic intervals",
  "scale-degree-sing": "Sing scale degrees",
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
  intervalId?: string;
  intervalSemitones?: number;
  presentation?: "melodic" | "harmonic";
  referenceMidi?: number;
  /** @deprecated Replaced by eligibleTagIds when interval pickers are off. */
  activeIntervalIds?: string[];
  selectedIntervalId?: string;
  contentTierId?: ContentTierId;
  eligibleTagIds?: readonly string[];
  degreeId?: string;
  tonicMidi?: number;
  activeDegreeIds?: string[];
  roundId: string;
  /** Position in the round (0-based) when this attempt was scored. */
  questionIndex: number;
}

export type AttemptInput = Omit<AttemptRecord, "id">;
