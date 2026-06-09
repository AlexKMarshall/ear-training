import { describe, expect, it } from "vitest"
import { CURRICULUM_PATH } from "../src/curriculum/levels.ts"
import type { SingExerciseDefinition } from "../src/exercise-definition.ts"
import { PRACTICE_MODE_LABELS, type PracticeModeId } from "../src/history/types.ts"
import { PRACTICE_MODES, type ResponseMode } from "../src/practice-modes/registry.ts"
import { chordInversionIdConfig } from "../src/ui/chord-inversion-id-tests.ts"
import { chordQualityIdConfig } from "../src/ui/chord-quality-id-tests.ts"
import type { IdentifyTestConfig } from "../src/ui/identify-test.ts"
import {
  intervalHarmonicIdConfig,
  intervalHarmonicSingExerciseDefinition,
  intervalMelodicIdConfig,
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

const IDENTIFY_CONFIGS: Record<PracticeModeId, IdentifyTestConfig | undefined> = {
  "single-note": undefined,
  "chord-sing": undefined,
  "interval-melodic-sing": undefined,
  "interval-named-sing": undefined,
  "interval-harmonic-sing": undefined,
  "interval-melodic-id": intervalMelodicIdConfig,
  "interval-harmonic-id": intervalHarmonicIdConfig,
  "chord-quality-id": chordQualityIdConfig,
  "chord-inversion-id": chordInversionIdConfig,
  "scale-degree-sing": undefined,
}

function definitionFor(
  id: PracticeModeId,
  mode: ResponseMode,
): SingExerciseDefinition | IdentifyTestConfig {
  if (mode === "sing") {
    const definition = SING_DEFINITIONS[id]
    if (!definition) {
      throw new Error(`Missing sing definition for ${id}`)
    }
    return definition
  }
  const config = IDENTIFY_CONFIGS[id]
  if (!config) {
    throw new Error(`Missing identify config for ${id}`)
  }
  return config
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
      expect(IDENTIFY_CONFIGS[id]).toBeUndefined()
    } else {
      expect(IDENTIFY_CONFIGS[id]).toBeDefined()
      expect(SING_DEFINITIONS[id]).toBeUndefined()
    }
  })

  it.each(
    PRACTICE_MODES.filter((e) => e.responseMode === "sing").map(
      (e) => [e.id, e.definition] as const,
    ),
  )("%s holds exercise definition wired through registry", (id, definition) => {
    expect(definition).toBe(SING_DEFINITIONS[id])
    expect(definition?.responseMode).toBe("sing")
  })
})
