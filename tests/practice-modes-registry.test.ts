import { describe, expect, it } from "vitest"
import { CURRICULUM_PATH } from "../src/curriculum/levels.ts"
import type {
  ExerciseDefinition,
  SelectExerciseDefinition,
  SingExerciseDefinition,
} from "../src/exercise-definition.ts"
import { PRACTICE_MODE_LABELS, type PracticeModeId } from "../src/history/types.ts"
import { PRACTICE_MODES, type ResponseMode } from "../src/practice-modes/registry.ts"
import { chordInversionIdExerciseDefinition } from "../src/ui/chord-inversion-id-tests.ts"
import { chordQualityIdExerciseDefinition } from "../src/ui/chord-quality-id-tests.ts"
import {
  intervalHarmonicIdExerciseDefinition,
  intervalHarmonicSingExerciseDefinition,
  intervalMelodicIdExerciseDefinition,
  intervalMelodicSingExerciseDefinition,
  intervalNamedSingExerciseDefinition,
} from "../src/ui/interval-tests.ts"
import { scaleDegreeSingExerciseDefinition } from "../src/ui/scale-degree-tests.ts"
import { chordSingExerciseDefinition, singleNoteExerciseDefinition } from "../src/ui/tests.ts"

const SING_DEFINITIONS: Record<PracticeModeId, SingExerciseDefinition | undefined> = {
  "single-note": singleNoteExerciseDefinition,
  "chord-sing": chordSingExerciseDefinition,
  "interval-melodic-sing": intervalMelodicSingExerciseDefinition,
  "interval-named-sing": intervalNamedSingExerciseDefinition,
  "interval-harmonic-sing": intervalHarmonicSingExerciseDefinition,
  "interval-melodic-id": undefined,
  "interval-harmonic-id": undefined,
  "chord-quality-id": undefined,
  "chord-inversion-id": undefined,
  "scale-degree-sing": scaleDegreeSingExerciseDefinition,
}

const SELECT_DEFINITIONS: Record<PracticeModeId, SelectExerciseDefinition | undefined> = {
  "single-note": undefined,
  "chord-sing": undefined,
  "interval-melodic-sing": undefined,
  "interval-named-sing": undefined,
  "interval-harmonic-sing": undefined,
  "interval-melodic-id": intervalMelodicIdExerciseDefinition,
  "interval-harmonic-id": intervalHarmonicIdExerciseDefinition,
  "chord-quality-id": chordQualityIdExerciseDefinition,
  "chord-inversion-id": chordInversionIdExerciseDefinition,
  "scale-degree-sing": undefined,
}

function definitionFor(id: PracticeModeId, mode: ResponseMode): ExerciseDefinition {
  if (mode === "sing") {
    const definition = SING_DEFINITIONS[id]
    if (!definition) {
      throw new Error(`Missing sing definition for ${id}`)
    }
    return definition
  }
  const definition = SELECT_DEFINITIONS[id]
  if (!definition) {
    throw new Error(`Missing select definition for ${id}`)
  }
  return definition
}

describe("exercise registry contract", () => {
  const registryIds = PRACTICE_MODES.map((e) => e.id)
  const labelIds = Object.keys(PRACTICE_MODE_LABELS) as PracticeModeId[]

  it("covers every PracticeModeId label and registry entry", () => {
    expect(registryIds.sort()).toEqual(labelIds.sort())
    expect(PRACTICE_MODES).toHaveLength(labelIds.length)
  })

  it("has unique ids and routes", () => {
    expect(new Set(registryIds).size).toBe(registryIds.length)
    const routes = PRACTICE_MODES.map((e) => e.route)
    expect(new Set(routes).size).toBe(routes.length)
    for (const entry of PRACTICE_MODES) {
      expect(entry.route).toMatch(/^\/[a-z0-9-]+\/$/)
    }
  })

  it("lists every curriculum path exercise", () => {
    expect([...registryIds].sort()).toEqual([...CURRICULUM_PATH].sort())
  })

  it.each(
    PRACTICE_MODES.map((e) => [e.id, e.responseMode, e.title, e.subtitle] as const),
  )("%s matches UI config practiceModeId, titles, and response mode", (id, responseMode, title, subtitle) => {
    const definition = definitionFor(id, responseMode)
    expect(definition.practiceModeId).toBe(id)
    expect(definition.title).toBe(title)
    expect(definition.subtitle).toBe(subtitle)
    if (responseMode === "sing") {
      expect(SING_DEFINITIONS[id]).toBeDefined()
      expect(SELECT_DEFINITIONS[id]).toBeUndefined()
    } else {
      expect(SELECT_DEFINITIONS[id]).toBeDefined()
      expect(SING_DEFINITIONS[id]).toBeUndefined()
    }
  })

  it.each(
    PRACTICE_MODES.map((e) => [e.id, e.definition] as const),
  )("%s holds exercise definition wired through registry", (id, definition) => {
    const expected = SING_DEFINITIONS[id] ?? SELECT_DEFINITIONS[id]
    expect(definition).toBe(expected)
    expect(definition?.responseMode).toBe(getPracticeModeResponseMode(id))
  })
})

function getPracticeModeResponseMode(id: PracticeModeId): ResponseMode {
  return PRACTICE_MODES.find((e) => e.id === id)?.responseMode ?? "sing"
}
