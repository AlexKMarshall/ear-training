import {
  EXERCISES_PER_LESSON,
  MAX_ATTEMPTS_PER_EXERCISE,
} from "./config.ts";
import {
  classifyExerciseOutcome,
  type LessonExerciseResult,
} from "./lesson.ts";
import type { LessonExercise } from "./lesson-exercise.ts";

export interface LessonRunSnapshot {
  lessonId: string;
  /** 0-based index of the exercise in play, or null before the first play of a slot. */
  currentExerciseIndex: number | null;
  /** 1-based display number for progress copy. */
  exerciseNumber: number;
  scoredAttemptsOnCurrent: number;
  lastPassed: boolean;
  results: readonly LessonExerciseResult[];
  canRetry: boolean;
  canAdvance: boolean;
  isLastExerciseInLesson: boolean;
  isLessonComplete: boolean;
}

/** Context for adapters to build and persist a history attempt after each scored try. */
export interface AttemptScoredContext {
  lessonId: string;
  exerciseIndex: number;
  passed: boolean;
  /** 1-based attempt number on the current exercise (after this score). */
  attemptNumber: number;
  scoredAttemptsOnCurrent: number;
  lastPassed: boolean;
}

export type AttemptScoredCallback = (context: AttemptScoredContext) => void;

export interface LessonRunOptions {
  onAttemptScored?: AttemptScoredCallback;
  createLessonId?: () => string;
  maxAttemptsPerExercise?: number;
  exercisesPerLesson?: number;
}

export class LessonRun {
  private lessonId: string;
  private currentExerciseIndex: number | null = null;
  private scoredAttemptsOnCurrent = 0;
  private lastPassed = false;
  private results: LessonExerciseResult[] = [];
  private readonly onAttemptScored?: AttemptScoredCallback;
  private readonly createLessonId: () => string;
  private readonly maxAttemptsPerExercise: number;
  private readonly exercisesPerLesson: number;

  constructor(options: LessonRunOptions = {}) {
    this.onAttemptScored = options.onAttemptScored;
    this.createLessonId = options.createLessonId ?? (() => crypto.randomUUID());
    this.maxAttemptsPerExercise =
      options.maxAttemptsPerExercise ?? MAX_ATTEMPTS_PER_EXERCISE;
    this.exercisesPerLesson =
      options.exercisesPerLesson ?? EXERCISES_PER_LESSON;
    this.lessonId = this.createLessonId();
  }

  reset(): void {
    this.lessonId = this.createLessonId();
    this.currentExerciseIndex = null;
    this.scoredAttemptsOnCurrent = 0;
    this.lastPassed = false;
    this.results = [];
  }

  /** Call when play prepares the current exercise (new slot only resets attempt counters). */
  ensureCurrentExercise(): void {
    if (this.currentExerciseIndex !== null) return;
    if (this.results.length >= this.exercisesPerLesson) return;
    this.currentExerciseIndex = this.results.length;
    this.scoredAttemptsOnCurrent = 0;
    this.lastPassed = false;
  }

  recordScore(passed: boolean): void {
    if (this.currentExerciseIndex === null) {
      throw new Error("Cannot record score before ensureCurrentExercise");
    }
    this.lastPassed = passed;
    this.scoredAttemptsOnCurrent += 1;
    const context: AttemptScoredContext = {
      lessonId: this.lessonId,
      exerciseIndex: this.currentExerciseIndex,
      passed,
      attemptNumber: this.scoredAttemptsOnCurrent,
      scoredAttemptsOnCurrent: this.scoredAttemptsOnCurrent,
      lastPassed: this.lastPassed,
    };
    this.onAttemptScored?.(context);
  }

  /** Replay the same exercise slot; lesson attempt counters are unchanged. */
  retryCurrentExercise(): void {
    if (!this.getSnapshot().canRetry) {
      throw new Error("Cannot retry when no tries remain or last attempt passed");
    }
  }

  advanceAfterResult(exercise?: LessonExercise): void {
    if (this.currentExerciseIndex === null) {
      throw new Error("Cannot advance without a current exercise");
    }
    if (!this.getSnapshot().canAdvance) {
      throw new Error("Cannot advance until the exercise is passed or attempts are exhausted");
    }
    this.results.push({
      exerciseIndex: this.currentExerciseIndex,
      outcome: classifyExerciseOutcome(
        this.lastPassed,
        this.scoredAttemptsOnCurrent,
      ),
      exercise,
    });
    this.currentExerciseIndex = null;
    this.scoredAttemptsOnCurrent = 0;
    this.lastPassed = false;
  }

  getSnapshot(): LessonRunSnapshot {
    const results = this.results;
    const exerciseNumber = results.length + 1;
    const isLastExerciseInLesson =
      results.length >= this.exercisesPerLesson - 1;
    const isLessonComplete = results.length >= this.exercisesPerLesson;
    const canRetry =
      this.currentExerciseIndex !== null &&
      !this.lastPassed &&
      this.scoredAttemptsOnCurrent > 0 &&
      this.scoredAttemptsOnCurrent < this.maxAttemptsPerExercise;
    const canAdvance =
      this.currentExerciseIndex !== null &&
      this.scoredAttemptsOnCurrent > 0 &&
      (this.lastPassed ||
        this.scoredAttemptsOnCurrent >= this.maxAttemptsPerExercise);

    return {
      lessonId: this.lessonId,
      currentExerciseIndex: this.currentExerciseIndex,
      exerciseNumber,
      scoredAttemptsOnCurrent: this.scoredAttemptsOnCurrent,
      lastPassed: this.lastPassed,
      results,
      canRetry,
      canAdvance,
      isLastExerciseInLesson,
      isLessonComplete,
    };
  }
}
