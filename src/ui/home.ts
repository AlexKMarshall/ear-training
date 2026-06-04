import { CURRICULUM_LEVELS } from "../curriculum/levels.ts";
import {
  computeStepProgress,
  getContinueExercise,
  getHighestUnlockedStepForExercise,
  getUnlockRequirement,
  isExerciseUnlocked,
  meetsStepThreshold,
  MIN_QUESTION_PASS_RATE,
  MIN_QUESTIONS,
} from "../curriculum/unlock.ts";
import { getExercise } from "../exercises/registry.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import { computeExerciseProgress } from "../history/stats.ts";
import type { AttemptRecord, ExerciseId } from "../history/types.ts";

const INTERVAL_EXERCISE_IDS = [
  "interval-melodic-sing",
  "interval-harmonic-sing",
  "interval-melodic-id",
  "interval-harmonic-id",
] as const satisfies readonly ExerciseId[];

function isInterval2bActive(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): boolean {
  if (!(INTERVAL_EXERCISE_IDS as readonly ExerciseId[]).includes(exerciseId)) {
    return false;
  }
  const step = getHighestUnlockedStepForExercise(exerciseId, records);
  return step?.contentTierId === "interval-2b";
}

function progressHint(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): string {
  if (!isExerciseUnlocked(exerciseId, records)) {
    const requirement = getUnlockRequirement(exerciseId);
    if (!requirement) {
      return "Locked";
    }
    return `Locked · complete ${requirement.predecessorLabel} first`;
  }

  const step = getHighestUnlockedStepForExercise(exerciseId, records);
  const progress = step
    ? computeStepProgress(step, records)
    : computeExerciseProgress(exerciseId, records);
  const { questionCount, questionPassRatePercent } = progress;
  const complete = step
    ? meetsStepThreshold(step, records)
    : questionCount >= MIN_QUESTIONS &&
      questionPassRatePercent >= MIN_QUESTION_PASS_RATE;

  if (complete) {
    const suffix = isInterval2bActive(exerciseId, records)
      ? " · + diatonic intervals"
      : "";
    return questionCount > 0
      ? `Complete · ${questionCount} questions${suffix}`
      : `Complete${suffix}`;
  }

  const tierNote = isInterval2bActive(exerciseId, records)
    ? " · diatonic intervals"
    : "";
  return `${questionCount} / ${MIN_QUESTIONS} questions · ${questionPassRatePercent}% pass (need ${MIN_QUESTION_PASS_RATE}%)${tierNote}`;
}

function renderExerciseCard(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): string {
  const entry = getExercise(exerciseId);
  const unlocked = isExerciseUnlocked(exerciseId, records);
  const step = getHighestUnlockedStepForExercise(exerciseId, records);
  const complete = step
    ? meetsStepThreshold(step, records)
    : (() => {
        const { questionCount, questionPassRatePercent } =
          computeExerciseProgress(exerciseId, records);
        return (
          questionCount >= MIN_QUESTIONS &&
          questionPassRatePercent >= MIN_QUESTION_PASS_RATE
        );
      })();
  const hint = progressHint(exerciseId, records);

  const statusClass = !unlocked
    ? "test-card-locked"
    : complete
      ? "test-card-complete"
      : "";

  const inner = `
    <span class="test-card-title">${entry.title}</span>
    <span class="test-card-desc">${entry.subtitle}</span>
    <span class="exercise-progress">${hint}</span>
  `;

  if (!unlocked) {
    return `<div class="test-card ${statusClass}" aria-disabled="true">${inner}</div>`;
  }

  return `<a href="${entry.route}" class="test-card ${statusClass}">${inner}</a>`;
}

function renderContinueSection(
  continueId: ExerciseId | null,
): string {
  if (!continueId) {
    return `
      <section class="home-continue home-continue-done" aria-label="Guided path">
        <p class="home-continue-done-text">You have completed the guided path. Keep practicing any exercise below.</p>
      </section>
    `;
  }

  const entry = getExercise(continueId);
  return `
    <section class="home-continue" aria-label="Continue guided path">
      <h2 class="home-section-title">Continue</h2>
      <a href="${entry.route}" class="test-card test-card-continue">
        <span class="test-card-title">${entry.title}</span>
        <span class="test-card-desc">${entry.subtitle}</span>
        <span class="exercise-progress">Pick up where you left off</span>
      </a>
    </section>
  `;
}

function renderCurriculumLevels(records: readonly AttemptRecord[]): string {
  return CURRICULUM_LEVELS.map((level) => {
    const levelUnlocked = level.exerciseIds.some((id) =>
      isExerciseUnlocked(id, records),
    );
    const exercises = level.exerciseIds
      .map((id) => renderExerciseCard(id, records))
      .join("");

    return `
      <section class="curriculum-level" aria-labelledby="level-${level.level}-heading">
        <div class="curriculum-level-header">
          <h2 id="level-${level.level}-heading" class="curriculum-level-title">
            <span class="curriculum-level-badge">Level ${level.level}</span>
            ${level.label}
          </h2>
          ${
            levelUnlocked
              ? ""
              : '<span class="curriculum-level-locked">Locked</span>'
          }
        </div>
        <div class="curriculum-exercise-list">
          ${exercises}
        </div>
      </section>
    `;
  }).join("");
}

export async function mountHome(
  root: HTMLElement,
  deps: MountDeps = {},
): Promise<void> {
  const history = deps.history ?? createDefaultHistoryPort();
  const records = await history.getAllAttempts();
  const continueId = getContinueExercise(records);

  root.innerHTML = `
    <main class="app">
      <header class="header">
        <h1>Ear Training</h1>
        <p class="subtitle">Guided path from single notes to intervals</p>
      </header>

      ${renderContinueSection(continueId)}

      <section class="home-curriculum" aria-label="Curriculum levels">
        <h2 class="home-section-title">Levels</h2>
        ${renderCurriculumLevels(records)}
      </section>

      <nav class="test-list" aria-label="More">
        <a href="/stats/" class="test-card test-card-stats">
          <span class="test-card-title">Your progress</span>
          <span class="test-card-desc">Accuracy, pitch error, and first-try rate</span>
        </a>
      </nav>
    </main>
  `;
}
