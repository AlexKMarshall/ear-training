import { getIntervalById, getIntervalsByIds, type IntervalEntry } from "./interval-config.ts"
import type { IntervalLessonExercise } from "./lesson-exercise.ts"
import { midiToHz, midiToNoteName, type NoteRange, type TargetNote } from "./notes.ts"
import { pickRandom } from "./util/array.ts"

export type IntervalPresentation = "melodic" | "harmonic"

export interface IntervalExercise {
  intervalId: string
  semitones: number
  presentation: IntervalPresentation
  lower: TargetNote
  upper: TargetNote
}

function targetNote(midi: number): TargetNote {
  return {
    midi,
    hz: midiToHz(midi),
    name: midiToNoteName(midi),
  }
}

/** Lower MIDI values where lower + semitones still fits in range. */
export function validLowerMidis(range: NoteRange, semitones: number): number[] {
  const midis: number[] = []
  const maxLower = range.highMidi - semitones
  for (let midi = range.lowMidi; midi <= maxLower; midi++) {
    midis.push(midi)
  }
  return midis
}

export function buildIntervalExercise(
  interval: IntervalEntry,
  presentation: IntervalPresentation,
  lowerMidi: number,
): IntervalExercise {
  const upperMidi = lowerMidi + interval.semitones
  return {
    intervalId: interval.id,
    semitones: interval.semitones,
    presentation,
    lower: targetNote(lowerMidi),
    upper: targetNote(upperMidi),
  }
}

export function randomIntervalExerciseForTag(
  intervalId: string,
  presentation: IntervalPresentation,
  range: NoteRange,
): IntervalExercise {
  const interval = getIntervalById(intervalId)
  if (!interval) {
    throw new Error(`Unknown interval id: ${intervalId}`)
  }
  return randomIntervalExercise(presentation, range, interval)
}

export function randomIntervalExercise(
  presentation: IntervalPresentation,
  range: NoteRange,
  interval: IntervalEntry,
): IntervalExercise {
  const lowers = validLowerMidis(range, interval.semitones)
  if (lowers.length === 0) {
    throw new Error(
      `No valid root for ${interval.label} in voice range (${range.lowMidi}–${range.highMidi})`,
    )
  }
  const lowerMidi = pickRandom(lowers)
  return buildIntervalExercise(interval, presentation, lowerMidi)
}

export function intervalToLessonExercise(
  intervalExercise: IntervalExercise,
): IntervalLessonExercise {
  return {
    type: "interval",
    target: intervalExercise.upper,
    interval: intervalExercise,
    intervalId: intervalExercise.intervalId,
  }
}

export interface IntervalChoice {
  id: string
  label: string
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const atI = copy[i]
    const atJ = copy[j]
    if (atI === undefined || atJ === undefined) {
      continue
    }
    copy[i] = atJ
    copy[j] = atI
  }
  return copy
}

/** Multiple-choice options for interval recognition (correct + distractors). */
export function buildIntervalChoices(
  correctId: string,
  eligibleIds: readonly string[],
): IntervalChoice[] {
  const pool = getIntervalsByIds(eligibleIds)
  const correct = pool.find((entry) => entry.id === correctId) ?? getIntervalById(correctId)
  if (!correct) {
    throw new Error(`Unknown interval id: ${correctId}`)
  }

  const others = pool.filter((entry) => entry.id !== correctId)
  const distractorCount = Math.min(3, others.length)
  const distractors = shuffle(others).slice(0, distractorCount)
  let options: IntervalChoice[] = [
    { id: correct.id, label: correct.label },
    ...distractors.map((entry) => ({ id: entry.id, label: entry.label })),
  ]

  if (options.length < 4 && pool.length > options.length) {
    options = pool.map((entry) => ({ id: entry.id, label: entry.label }))
  }

  return shuffle(options)
}
