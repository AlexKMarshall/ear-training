import { describe, expect, it } from "vitest";
import { CURRICULUM_PATH } from "../src/curriculum/levels.ts";
import { EXERCISES, type ResponseMode } from "../src/exercises/registry.ts";
import { EXERCISE_LABELS, type ExerciseId } from "../src/history/types.ts";
import {
  intervalHarmonicIdConfig,
  intervalHarmonicSingConfig,
  intervalMelodicIdConfig,
  intervalMelodicSingConfig,
} from "../src/ui/interval-tests.ts";
import { scaleDegreeSingConfig } from "../src/ui/scale-degree-tests.ts";
import type { IdentifyTestConfig } from "../src/ui/identify-test.ts";
import type { SingTestConfig } from "../src/ui/sing-test.ts";
import {
  chordMiddleTestConfig,
  singleNoteTestConfig,
} from "../src/ui/tests.ts";

const SING_CONFIGS: Record<
  ExerciseId,
  SingTestConfig | undefined
> = {
  "single-note": singleNoteTestConfig,
  "chord-middle": chordMiddleTestConfig,
  "interval-melodic-sing": intervalMelodicSingConfig,
  "interval-harmonic-sing": intervalHarmonicSingConfig,
  "interval-melodic-id": undefined,
  "interval-harmonic-id": undefined,
  "scale-degree-sing": scaleDegreeSingConfig,
};

const IDENTIFY_CONFIGS: Record<
  ExerciseId,
  IdentifyTestConfig | undefined
> = {
  "single-note": undefined,
  "chord-middle": undefined,
  "interval-melodic-sing": undefined,
  "interval-harmonic-sing": undefined,
  "interval-melodic-id": intervalMelodicIdConfig,
  "interval-harmonic-id": intervalHarmonicIdConfig,
  "scale-degree-sing": undefined,
};

function configFor(
  id: ExerciseId,
  mode: ResponseMode,
): SingTestConfig | IdentifyTestConfig {
  if (mode === "sing") {
    const config = SING_CONFIGS[id];
    if (!config) {
      throw new Error(`Missing sing config for ${id}`);
    }
    return config;
  }
  const config = IDENTIFY_CONFIGS[id];
  if (!config) {
    throw new Error(`Missing identify config for ${id}`);
  }
  return config;
}

describe("exercise registry contract", () => {
  const registryIds = EXERCISES.map((e) => e.id);
  const labelIds = Object.keys(EXERCISE_LABELS) as ExerciseId[];

  it("covers every ExerciseId label and registry entry", () => {
    expect(registryIds.sort()).toEqual(labelIds.sort());
    expect(EXERCISES).toHaveLength(labelIds.length);
  });

  it("has unique ids and routes", () => {
    expect(new Set(registryIds).size).toBe(registryIds.length);
    const routes = EXERCISES.map((e) => e.route);
    expect(new Set(routes).size).toBe(routes.length);
    for (const entry of EXERCISES) {
      expect(entry.route).toMatch(/^\/[a-z0-9-]+\/$/);
    }
  });

  it("lists every curriculum path exercise", () => {
    expect([...registryIds].sort()).toEqual([...CURRICULUM_PATH].sort());
  });

  it.each(EXERCISES.map((e) => [e.id, e.responseMode, e.title, e.subtitle] as const))(
    "%s matches UI config exerciseId, titles, and response mode",
    (id, responseMode, title, subtitle) => {
      const config = configFor(id, responseMode);
      expect(config.exerciseId).toBe(id);
      expect(config.title).toBe(title);
      expect(config.subtitle).toBe(subtitle);
      if (responseMode === "sing") {
        expect(SING_CONFIGS[id]).toBeDefined();
        expect(IDENTIFY_CONFIGS[id]).toBeUndefined();
      } else {
        expect(IDENTIFY_CONFIGS[id]).toBeDefined();
        expect(SING_CONFIGS[id]).toBeUndefined();
      }
    },
  );
});
