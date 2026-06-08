import type { MountDeps } from "../history/port.ts"
import type { PracticeModeId } from "../history/types.ts"
import {
  mountIntervalHarmonicIdTest,
  mountIntervalHarmonicSingTest,
  mountIntervalMelodicIdTest,
  mountIntervalMelodicSingTest,
  mountIntervalNamedSingTest,
} from "../ui/interval-tests.ts"
import { mountScaleDegreeSingTest } from "../ui/scale-degree-tests.ts"
import { mountChordMiddleTest, mountSingleNoteTest } from "../ui/tests.ts"

export type ResponseMode = "sing" | "select"

export interface PracticeModeEntry {
  id: PracticeModeId
  responseMode: ResponseMode
  route: string
  title: string
  subtitle: string
  mount: (root: HTMLElement, deps?: MountDeps) => void
}

const PRACTICE_MODE_ENTRIES: readonly PracticeModeEntry[] = [
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
    id: "interval-named-sing",
    responseMode: "sing",
    route: "/interval-named-sing/",
    title: "Sing named intervals",
    subtitle: "Hear one note, then sing the named interval above it",
    mount: mountIntervalNamedSingTest,
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
    subtitle: "One key per lesson — hear the tonic, then sing each requested scale degree",
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
