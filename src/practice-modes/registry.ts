import type { ExerciseDefinition } from "../exercise-definition.ts"
import type { MountDeps } from "../history/port.ts"
import type { PracticeModeId } from "../history/types.ts"
import {
  chordInversionIdExerciseDefinition,
  mountChordInversionIdTest,
} from "../ui/chord-inversion-id-tests.ts"
import {
  chordQualityIdExerciseDefinition,
  mountChordQualityIdTest,
} from "../ui/chord-quality-id-tests.ts"
import {
  intervalHarmonicIdExerciseDefinition,
  intervalHarmonicSingExerciseDefinition,
  intervalMelodicIdExerciseDefinition,
  intervalMelodicSingExerciseDefinition,
  intervalNamedSingExerciseDefinition,
  mountIntervalHarmonicIdTest,
  mountIntervalHarmonicSingTest,
  mountIntervalMelodicIdTest,
  mountIntervalMelodicSingTest,
  mountIntervalNamedSingTest,
} from "../ui/interval-tests.ts"
import { mountExercise } from "../ui/mount-exercise.ts"
import {
  mountScaleDegreeSingTest,
  scaleDegreeSingExerciseDefinition,
} from "../ui/scale-degree-tests.ts"
import {
  chordSingExerciseDefinition,
  mountChordSingTest,
  singleNoteExerciseDefinition,
} from "../ui/tests.ts"

export type ResponseMode = "sing" | "select"

export interface PracticeModeEntry {
  id: PracticeModeId
  responseMode: ResponseMode
  route: string
  title: string
  subtitle: string
  definition?: ExerciseDefinition
  mount: (root: HTMLElement, deps?: MountDeps) => void
}

const PRACTICE_MODE_ENTRIES: readonly PracticeModeEntry[] = [
  {
    id: "single-note",
    responseMode: "sing",
    route: "/single-note/",
    title: "Sing a single note",
    subtitle: "Sing back the note you hear",
    get definition() {
      return singleNoteExerciseDefinition
    },
    mount: (root, deps) => mountExercise(root, singleNoteExerciseDefinition, deps),
  },
  {
    id: "chord-sing",
    responseMode: "sing",
    route: "/chord-sing/",
    title: "Sing chord voices",
    subtitle: "Hear a triad and sing the prompted voice",
    get definition() {
      return chordSingExerciseDefinition
    },
    mount: mountChordSingTest,
  },
  {
    id: "chord-quality-id",
    responseMode: "select",
    route: "/chord-quality-id/",
    title: "Chords",
    subtitle: "Quality identification · root position",
    get definition() {
      return chordQualityIdExerciseDefinition
    },
    mount: mountChordQualityIdTest,
  },
  {
    id: "chord-inversion-id",
    responseMode: "select",
    route: "/chord-inversion-id/",
    title: "Chords",
    subtitle: "Inversion identification · major triad",
    get definition() {
      return chordInversionIdExerciseDefinition
    },
    mount: mountChordInversionIdTest,
  },
  {
    id: "interval-melodic-sing",
    responseMode: "sing",
    route: "/interval-melodic-sing/",
    title: "Sing melodic intervals",
    subtitle: "Hear two notes in sequence, then sing the top note",
    get definition() {
      return intervalMelodicSingExerciseDefinition
    },
    mount: mountIntervalMelodicSingTest,
  },
  {
    id: "interval-named-sing",
    responseMode: "sing",
    route: "/interval-named-sing/",
    title: "Sing named intervals",
    subtitle: "Hear one note, then sing the named interval above it",
    get definition() {
      return intervalNamedSingExerciseDefinition
    },
    mount: mountIntervalNamedSingTest,
  },
  {
    id: "interval-harmonic-sing",
    responseMode: "sing",
    route: "/interval-harmonic-sing/",
    title: "Sing harmonic intervals",
    subtitle: "Hear two notes together, then sing the top note",
    get definition() {
      return intervalHarmonicSingExerciseDefinition
    },
    mount: mountIntervalHarmonicSingTest,
  },
  {
    id: "interval-melodic-id",
    responseMode: "select",
    route: "/interval-melodic-id/",
    title: "Identify melodic intervals",
    subtitle: "Hear two notes in sequence, then choose the interval",
    get definition() {
      return intervalMelodicIdExerciseDefinition
    },
    mount: mountIntervalMelodicIdTest,
  },
  {
    id: "interval-harmonic-id",
    responseMode: "select",
    route: "/interval-harmonic-id/",
    title: "Identify harmonic intervals",
    subtitle: "Hear two notes together, then choose the interval",
    get definition() {
      return intervalHarmonicIdExerciseDefinition
    },
    mount: mountIntervalHarmonicIdTest,
  },
  {
    id: "scale-degree-sing",
    responseMode: "sing",
    route: "/scale-degree-sing/",
    title: "Sing scale degrees",
    subtitle: "One key per lesson — hear the tonic, then sing each requested scale degree",
    get definition() {
      return scaleDegreeSingExerciseDefinition
    },
    mount: mountScaleDegreeSingTest,
  },
]

export const PRACTICE_MODES: readonly PracticeModeEntry[] = PRACTICE_MODE_ENTRIES

export function getPracticeMode(id: PracticeModeId): PracticeModeEntry {
  const entry = PRACTICE_MODES.find((e) => e.id === id)
  if (!entry) {
    throw new Error(`Unknown practice mode: ${id}`)
  }
  return entry
}

export async function mountPracticeMode(
  root: HTMLElement,
  id: PracticeModeId,
  deps?: MountDeps,
): Promise<void> {
  getPracticeMode(id).mount(root, deps)
}
