import type { InversionId } from "../chord-inversions.ts"
import type { ContentTierId } from "../curriculum/curriculum-lessons.ts"
import type { VoicingPositionId } from "../voicing-position.ts"

export type PracticeModeId =
  | "single-note"
  | "chord-sing"
  | "chord-quality-id"
  | "interval-melodic-sing"
  | "interval-named-sing"
  | "interval-harmonic-sing"
  | "interval-melodic-id"
  | "interval-harmonic-id"
  | "scale-degree-sing"

export const PRACTICE_MODE_LABELS: Record<PracticeModeId, string> = {
  "single-note": "Sing a single note",
  "chord-sing": "Sing chord voices",
  "chord-quality-id": "Identify chord quality",
  "interval-melodic-sing": "Sing melodic intervals",
  "interval-named-sing": "Sing named intervals",
  "interval-harmonic-sing": "Sing harmonic intervals",
  "interval-melodic-id": "Identify melodic intervals",
  "interval-harmonic-id": "Identify harmonic intervals",
  "scale-degree-sing": "Sing scale degrees",
}

/** One scored mic attempt, persisted for stats and future drill weighting. */
export interface AttemptRecord {
  id?: number
  practiceModeId: PracticeModeId
  timestamp: number
  centsOff: number
  passed: boolean
  /** 1-based attempt within the current exercise (max 3). */
  attemptNumber: number
  targetMidi: number
  targetHz: number
  targetName: string
  /** Voiced chord tones when the reference was a chord. */
  chordNotes?: readonly { midi: number; name: string }[]
  chordTypeId?: string
  inversionId?: InversionId
  voicingPositionId?: VoicingPositionId
  voiceType?: string
  intervalId?: string
  intervalSemitones?: number
  presentation?: "melodic" | "harmonic"
  referenceMidi?: number
  /** @deprecated Replaced by eligibleTagIds when interval pickers are off. */
  activeIntervalIds?: string[]
  selectedIntervalId?: string
  contentTierId?: ContentTierId
  eligibleTagIds?: readonly string[]
  degreeId?: string
  tonicMidi?: number
  activeDegreeIds?: string[]
  lessonId: string
  /** Position in the lesson (0-based) when this attempt was scored. */
  exerciseIndex: number
}

export type AttemptInput = Omit<AttemptRecord, "id">
