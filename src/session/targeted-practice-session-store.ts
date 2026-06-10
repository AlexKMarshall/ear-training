import { EXERCISES_PER_LESSON } from "../config.ts"
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import { curriculumLessonKey } from "../curriculum/curriculum-lessons.ts"
import { parseCurriculumLessonParam } from "../curriculum/lesson-link.ts"
import type { PracticeModeId } from "../history/types.ts"
import type { ExerciseOutcome } from "../lesson.ts"
import type { LessonRunInitialState, LessonRunSnapshot } from "../lesson-run.ts"
import type { TargetedPracticePlan } from "./targeted-practice-planner.ts"

const STORAGE_KEY = "ear-training-targeted-practice-session"
const SCHEMA_VERSION = 1

interface PersistedFocusArea {
  curriculumLessonKey: string
  tagId: string
  label: string
}

interface PersistedSlot {
  curriculumLessonKey: string
  tagId: string
  practiceModeId: PracticeModeId
}

interface PersistedPlan {
  family: string
  focusAreas: PersistedFocusArea[]
  focusTagLabels: string[]
  slots: PersistedSlot[]
}

interface PersistedLessonRunResult {
  exerciseIndex: number
  outcome: ExerciseOutcome
}

interface PersistedLessonRun {
  lessonId: string
  currentExerciseIndex: number | null
  scoredAttemptsOnCurrent: number
  lastPassed: boolean
  results: PersistedLessonRunResult[]
}

interface PersistedTargetedPracticeSession {
  version: number
  plan: PersistedPlan
  lessonRun: PersistedLessonRun
}

export interface TargetedPracticeSessionState {
  plan: TargetedPracticePlan
  lessonRun: LessonRunInitialState
}

export type TargetedPracticeHomeCardState =
  | { kind: "fresh" }
  | {
      kind: "resume"
      family: string
      focusTagLabels: readonly string[]
      exerciseNumber: number
      totalExercises: number
      progressLabel: string
    }

let memorySession: PersistedTargetedPracticeSession | null = null

function readStoredSession(): PersistedTargetedPracticeSession | null {
  if (memorySession) {
    return memorySession
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    return parsePersistedSession(parsed)
  } catch {
    return memorySession
  }
}

function writeStoredSession(session: PersistedTargetedPracticeSession | null): void {
  memorySession = session
  try {
    if (session === null) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
}

function parseCurriculumLessonKey(key: string): CurriculumLesson | null {
  return parseCurriculumLessonParam(key)
}

function isPracticeModeId(value: string): value is PracticeModeId {
  return typeof value === "string" && value.length > 0
}

function isExerciseOutcome(value: string): value is ExerciseOutcome {
  return value === "firstTry" || value === "retry" || value === "wrong"
}

function parsePersistedSession(value: unknown): PersistedTargetedPracticeSession | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  if (record.version !== SCHEMA_VERSION) {
    return null
  }
  const plan = parsePersistedPlan(record.plan)
  const lessonRun = parsePersistedLessonRun(record.lessonRun)
  if (!plan || !lessonRun) {
    return null
  }
  return { version: SCHEMA_VERSION, plan, lessonRun }
}

function parsePersistedPlan(value: unknown): PersistedPlan | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  if (typeof record.family !== "string") {
    return null
  }
  if (
    !Array.isArray(record.focusTagLabels) ||
    !record.focusTagLabels.every((v) => typeof v === "string")
  ) {
    return null
  }
  const focusAreas = parsePersistedFocusAreas(record.focusAreas)
  const slots = parsePersistedSlots(record.slots)
  if (!focusAreas || !slots) {
    return null
  }
  return {
    family: record.family,
    focusAreas,
    focusTagLabels: record.focusTagLabels,
    slots,
  }
}

function parsePersistedFocusAreas(value: unknown): PersistedFocusArea[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const focusAreas: PersistedFocusArea[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return null
    }
    const area = entry as Record<string, unknown>
    if (
      typeof area.curriculumLessonKey !== "string" ||
      typeof area.tagId !== "string" ||
      typeof area.label !== "string"
    ) {
      return null
    }
    focusAreas.push({
      curriculumLessonKey: area.curriculumLessonKey,
      tagId: area.tagId,
      label: area.label,
    })
  }
  return focusAreas
}

function parsePersistedSlots(value: unknown): PersistedSlot[] | null {
  if (!Array.isArray(value)) {
    return null
  }
  const slots: PersistedSlot[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return null
    }
    const slot = entry as Record<string, unknown>
    if (
      typeof slot.curriculumLessonKey !== "string" ||
      typeof slot.tagId !== "string" ||
      !isPracticeModeId(slot.practiceModeId as string)
    ) {
      return null
    }
    slots.push({
      curriculumLessonKey: slot.curriculumLessonKey,
      tagId: slot.tagId,
      practiceModeId: slot.practiceModeId as PracticeModeId,
    })
  }
  return slots
}

function parsePersistedLessonRun(value: unknown): PersistedLessonRun | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  if (typeof record.lessonId !== "string") {
    return null
  }
  if (
    record.currentExerciseIndex !== null &&
    (typeof record.currentExerciseIndex !== "number" ||
      !Number.isInteger(record.currentExerciseIndex))
  ) {
    return null
  }
  if (
    typeof record.scoredAttemptsOnCurrent !== "number" ||
    !Number.isInteger(record.scoredAttemptsOnCurrent) ||
    typeof record.lastPassed !== "boolean" ||
    !Array.isArray(record.results)
  ) {
    return null
  }
  const results: PersistedLessonRunResult[] = []
  for (const entry of record.results) {
    if (!entry || typeof entry !== "object") {
      return null
    }
    const result = entry as Record<string, unknown>
    if (
      typeof result.exerciseIndex !== "number" ||
      !Number.isInteger(result.exerciseIndex) ||
      typeof result.outcome !== "string" ||
      !isExerciseOutcome(result.outcome)
    ) {
      return null
    }
    results.push({ exerciseIndex: result.exerciseIndex, outcome: result.outcome })
  }
  return {
    lessonId: record.lessonId,
    currentExerciseIndex: record.currentExerciseIndex,
    scoredAttemptsOnCurrent: record.scoredAttemptsOnCurrent,
    lastPassed: record.lastPassed,
    results,
  }
}

function serializePlan(plan: TargetedPracticePlan): PersistedPlan {
  return {
    family: plan.family,
    focusTagLabels: [...plan.focusTagLabels],
    focusAreas: plan.focusAreas.map((area) => ({
      curriculumLessonKey: curriculumLessonKey(area.curriculumLesson),
      tagId: area.tagId,
      label: area.label,
    })),
    slots: plan.slots.map((slot) => ({
      curriculumLessonKey: curriculumLessonKey(slot.curriculumLesson),
      tagId: slot.tagId,
      practiceModeId: slot.practiceModeId,
    })),
  }
}

function serializeLessonRun(snapshot: LessonRunSnapshot): PersistedLessonRun {
  return {
    lessonId: snapshot.lessonId,
    currentExerciseIndex: snapshot.currentExerciseIndex,
    scoredAttemptsOnCurrent: snapshot.scoredAttemptsOnCurrent,
    lastPassed: snapshot.lastPassed,
    results: snapshot.results.map((result) => ({
      exerciseIndex: result.exerciseIndex,
      outcome: result.outcome,
    })),
  }
}

function deserializePlan(plan: PersistedPlan): TargetedPracticePlan | null {
  const focusAreas = []
  for (const area of plan.focusAreas) {
    const curriculumLesson = parseCurriculumLessonKey(area.curriculumLessonKey)
    if (!curriculumLesson) {
      return null
    }
    focusAreas.push({
      curriculumLesson,
      tagId: area.tagId,
      label: area.label,
    })
  }

  const slots = []
  for (const slot of plan.slots) {
    const curriculumLesson = parseCurriculumLessonKey(slot.curriculumLessonKey)
    if (!curriculumLesson) {
      return null
    }
    if (slot.practiceModeId !== curriculumLesson.practiceModeId) {
      return null
    }
    slots.push({
      curriculumLesson,
      tagId: slot.tagId,
      practiceModeId: slot.practiceModeId,
    })
  }

  return {
    family: plan.family,
    focusAreas,
    focusTagLabels: plan.focusTagLabels,
    slots,
  }
}

function deserializeLessonRun(lessonRun: PersistedLessonRun): LessonRunInitialState {
  return {
    lessonId: lessonRun.lessonId,
    currentExerciseIndex: lessonRun.currentExerciseIndex,
    scoredAttemptsOnCurrent: lessonRun.scoredAttemptsOnCurrent,
    lastPassed: lessonRun.lastPassed,
    results: lessonRun.results.map((result) => ({
      exerciseIndex: result.exerciseIndex,
      outcome: result.outcome,
    })),
  }
}

function exerciseNumberFromLessonRun(lessonRun: PersistedLessonRun): number {
  return lessonRun.results.length + 1
}

function progressLabel(exerciseNumber: number, totalExercises: number): string {
  return `Resume · ${exerciseNumber}/${totalExercises}`
}

export function saveTargetedPracticeSession(
  plan: TargetedPracticePlan,
  lessonRun: LessonRunSnapshot,
): void {
  writeStoredSession({
    version: SCHEMA_VERSION,
    plan: serializePlan(plan),
    lessonRun: serializeLessonRun(lessonRun),
  })
}

export function updateTargetedPracticeLessonRun(lessonRun: LessonRunSnapshot): void {
  const existing = readStoredSession()
  if (!existing) {
    return
  }
  writeStoredSession({
    ...existing,
    lessonRun: serializeLessonRun(lessonRun),
  })
}

export function loadTargetedPracticeSession(): TargetedPracticeSessionState | null {
  const stored = readStoredSession()
  if (!stored) {
    return null
  }
  const plan = deserializePlan(stored.plan)
  if (!plan) {
    clearTargetedPracticeSession()
    return null
  }
  return {
    plan,
    lessonRun: deserializeLessonRun(stored.lessonRun),
  }
}

export function clearTargetedPracticeSession(): void {
  writeStoredSession(null)
}

export function getTargetedPracticeHomeCardState(): TargetedPracticeHomeCardState {
  const stored = readStoredSession()
  if (!stored) {
    return { kind: "fresh" }
  }
  const exerciseNumber = exerciseNumberFromLessonRun(stored.lessonRun)
  return {
    kind: "resume",
    family: stored.plan.family,
    focusTagLabels: stored.plan.focusTagLabels,
    exerciseNumber,
    totalExercises: EXERCISES_PER_LESSON,
    progressLabel: progressLabel(exerciseNumber, EXERCISES_PER_LESSON),
  }
}

/** Clears stored targeted practice when the learner starts a guided-path lesson. */
export function clearTargetedPracticeSessionForGuidedPathLesson(): void {
  clearTargetedPracticeSession()
}

/** Clears persisted and in-memory session state (for tests). */
export function resetTargetedPracticeSessionStore(): void {
  memorySession = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
