import type { ContentTierId } from "./curriculum/steps.ts";
import type { InversionId } from "./chord-inversions.ts";
import type { ChordQuestion } from "./chords.ts";
import type { IntervalQuestion } from "./interval-questions.ts";
import type { TargetNote } from "./notes.ts";
import type { ScaleDegreeQuestion } from "./scale-degree-questions.ts";

export interface SingTestQuestion {
  target: TargetNote;
  /** Present when the reference is a chord rather than a single tone. */
  chord?: ChordQuestion;
  chordTypeId?: string;
  inversionId?: InversionId;
  interval?: IntervalQuestion;
  intervalId?: string;
  contentTierId?: ContentTierId;
  eligibleTagIds?: readonly string[];
  scaleDegree?: ScaleDegreeQuestion;
  degreeId?: string;
}
