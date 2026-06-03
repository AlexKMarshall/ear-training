import { CURRICULUM_LEVELS, FREE_PRACTICE_IDS } from "../curriculum/levels.ts";
import {
  getContinueExercise,
  getUnlockRequirement,
  isExerciseUnlocked,
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

function meetsProgressThreshold(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): boolean {
  const { questionCount, questionPassRatePercent } = computeExerciseProgress(
    exerciseId,
    records,
  );
  return (
    questionCount >= MIN_QUESTIONS &&
    questionPassRatePercent >= MIN_QUESTION_PASS_RATE
  );
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

  const { questionCount, questionPassRatePercent } = computeExerciseProgress(
    exerciseId,
    records,
  );

  if (meetsProgressThreshold(exerciseId, records)) {
    return questionCount > 0
      ? `Complete · ${questionCount} questions`
      : "Complete";
  }

  return `${questionCount} / ${MIN_QUESTIONS} questions · ${questionPassRatePercent}% pass (need ${MIN_QUESTION_PASS_RATE}%)`;
}

function renderExerciseCard(
  exerciseId: ExerciseId,
  records: readonly AttemptRecord[],
): string {
  const entry = getExercise(exerciseId);
  const unlocked = isExerciseUnlocked(exerciseId, records);
  const complete = meetsProgressThreshold(exerciseId, records);
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

function renderFreePractice(records: readonly AttemptRecord[]): string {
  const cards = FREE_PRACTICE_IDS.map((id) =>
    renderExerciseCard(id, records),
  ).join("");

  return `
    <section class="home-free-practice" aria-labelledby="free-practice-heading">
      <h2 id="free-practice-heading" class="home-section-title">Free practice</h2>
      <p class="home-section-desc">Outside the guided path — always available.</p>
      <div class="curriculum-exercise-list">
        ${cards}
      </div>
    </section>
  `;
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

      ${renderFreePractice(records)}

      <nav class="test-list" aria-label="More">
        <a href="/stats/" class="test-card test-card-stats">
          <span class="test-card-title">Your progress</span>
          <span class="test-card-desc">Accuracy, pitch error, and first-try rate</span>
        </a>
      </nav>
    </main>
  `;
}
