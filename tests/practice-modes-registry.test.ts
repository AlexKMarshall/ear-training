import { describe, expect, it } from "vitest"
import { CURRICULUM_PATH } from "../src/curriculum/levels.ts"
import { PRACTICE_MODE_LABELS, type PracticeModeId } from "../src/history/types.ts"
import { PRACTICE_MODES, type ResponseMode } from "../src/practice-modes/registry.ts"
import { chordInversionIdConfig } from "../src/ui/chord-inversion-id-tests.ts"
import { chordQualityIdConfig } from "../src/ui/chord-quality-id-tests.ts"
import type { IdentifyTestConfig } from "../src/ui/identify-test.ts"
import {
  intervalHarmonicIdConfig,
  intervalHarmonicSingConfig,
  intervalMelodicIdConfig,
  intervalMelodicSingConfig,
  intervalNamedSingConfig,
} from "../src/ui/interval-tests.ts"
import { scaleDegreeSingConfig } from "../src/ui/scale-degree-tests.ts"
import type { SingTestConfig } from "../src/ui/sing-test.ts"
import {
  chordSingTestConfig,
  singleNoteExerciseDefinition,
  singleNoteTestConfig,
} from "../src/ui/tests.ts"

const SING_CONFIGS: Record<PracticeModeId, SingTestConfig | undefined> = {
  "single-note": singleNoteTestConfig,
  "chord-sing": chordSingTestConfig,
  "interval-melodic-sing": intervalMelodicSingConfig,
  "interval-named-sing": intervalNamedSingConfig,
  "interval-harmonic-sing": intervalHarmonicSingConfig,
  "interval-melodic-id": undefined,
  "interval-harmonic-id": undefined,
  "chord-quality-id": undefined,
  "chord-inversion-id": undefined,
  "scale-degree-sing": scaleDegreeSingConfig,
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

function configFor(id: PracticeModeId, mode: ResponseMode): SingTestConfig | IdentifyTestConfig {
  if (mode === "sing") {
    const config = SING_CONFIGS[id]
    if (!config) {
      throw new Error(`Missing sing config for ${id}`)
    }
    return config
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
    const config = configFor(id, responseMode)
    expect(config.practiceModeId).toBe(id)
    expect(config.title).toBe(title)
    expect(config.subtitle).toBe(subtitle)
    if (responseMode === "sing") {
      expect(SING_CONFIGS[id]).toBeDefined()
      expect(IDENTIFY_CONFIGS[id]).toBeUndefined()
    } else {
      expect(IDENTIFY_CONFIGS[id]).toBeDefined()
      expect(SING_CONFIGS[id]).toBeUndefined()
    }
  })

  it("holds exercise definition for migrated single-note mode", () => {
    const entry = PRACTICE_MODES.find((e) => e.id === "single-note")
    expect(entry?.definition).toBe(singleNoteExerciseDefinition)
    expect(entry?.definition?.responseMode).toBe("sing")
  })
})
