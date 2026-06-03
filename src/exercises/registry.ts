import type { ExerciseId } from "../history/types.ts";
import {
  mountChordMiddleTest,
  mountSingleNoteTest,
} from "../ui/tests.ts";
import {
  mountIntervalHarmonicIdTest,
  mountIntervalHarmonicSingTest,
  mountIntervalMelodicIdTest,
  mountIntervalMelodicSingTest,
} from "../ui/interval-tests.ts";
import { mountScaleDegreeSingTest } from "../ui/scale-degree-tests.ts";

export type ResponseMode = "sing" | "select";

export interface ExerciseEntry {
  id: ExerciseId;
  responseMode: ResponseMode;
  route: string;
  title: string;
  subtitle: string;
  mount: (root: HTMLElement) => void;
}

const EXERCISE_ENTRIES: readonly ExerciseEntry[] = [
  {
    id: "single-note",
    responseMode: "sing",
    route: "/single-note/",
    title: "Sing a single note",
    subtitle: "Sing back the note you hear",
    mount: mountSingleNoteTest,
  },
  {
    id: "chord-middle",
    responseMode: "sing",
    route: "/chord-middle/",
    title: "Sing the middle note",
    subtitle: "Hear a chord and sing the middle note",
    mount: mountChordMiddleTest,
  },
  {
    id: "interval-melodic-sing",
    responseMode: "sing",
    route: "/interval-melodic-sing/",
    title: "Sing melodic intervals",
    subtitle: "Hear two notes in sequence, then sing the top note",
    mount: mountIntervalMelodicSingTest,
  },
  {
    id: "interval-harmonic-sing",
    responseMode: "sing",
    route: "/interval-harmonic-sing/",
    title: "Sing harmonic intervals",
    subtitle: "Hear two notes together, then sing the top note",
    mount: mountIntervalHarmonicSingTest,
  },
  {
    id: "interval-melodic-id",
    responseMode: "select",
    route: "/interval-melodic-id/",
    title: "Identify melodic intervals",
    subtitle: "Hear two notes in sequence, then choose the interval",
    mount: mountIntervalMelodicIdTest,
  },
  {
    id: "interval-harmonic-id",
    responseMode: "select",
    route: "/interval-harmonic-id/",
    title: "Identify harmonic intervals",
    subtitle: "Hear two notes together, then choose the interval",
    mount: mountIntervalHarmonicIdTest,
  },
  {
    id: "scale-degree-sing",
    responseMode: "sing",
    route: "/scale-degree-sing/",
    title: "Sing scale degrees",
    subtitle: "Hear the tonic, then sing the requested scale degree in that key",
    mount: mountScaleDegreeSingTest,
  },
];

export const EXERCISES: readonly ExerciseEntry[] = EXERCISE_ENTRIES;

export function getExercise(id: ExerciseId): ExerciseEntry {
  const entry = EXERCISES.find((e) => e.id === id);
  if (!entry) {
    throw new Error(`Unknown exercise: ${id}`);
  }
  return entry;
}

export function mountExercise(root: HTMLElement, id: ExerciseId): void {
  getExercise(id).mount(root);
}
