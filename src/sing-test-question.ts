import type { ChordQuestion } from "./chords.ts";
import type { TargetNote } from "./notes.ts";

export interface SingTestQuestion {
  target: TargetNote;
  /** Present when the reference is a chord rather than a single tone. */
  chord?: ChordQuestion;
}
