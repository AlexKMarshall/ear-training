import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import type { SessionHistoryCache } from "./session-cache.ts"
import { getAllAttempts, saveAttempt } from "./store.ts"
import type { AttemptInput, AttemptRecord } from "./types.ts"

export interface HistoryPort {
  getAllAttempts(): Promise<AttemptRecord[]>
  saveAttempt(input: AttemptInput): Promise<void>
}

export interface MountDeps {
  history?: HistoryPort
  /** Hydrated attempt history for planner draws and persistence on this page load. */
  sessionHistory?: SessionHistoryCache
  /** Resolved curriculum step for this mount (from URL or guided default). */
  sessionCurriculumLesson?: CurriculumLesson
  /** Override `location.search` (tests). */
  locationSearch?: string
}

export function createDefaultHistoryPort(): HistoryPort {
  return { getAllAttempts, saveAttempt }
}

export function createMemoryHistoryPort(initial: AttemptRecord[] = []): HistoryPort {
  const records = [...initial]

  return {
    getAllAttempts: async () => [...records],
    saveAttempt: async (input) => {
      records.push({ ...input })
    },
  }
}
