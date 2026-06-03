import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import { computeDashboardStats, type ExerciseStats } from "../history/stats.ts";

function renderExerciseSection(stats: ExerciseStats): string {
  if (stats.attemptCount === 0) {
    return `
      <section class="stats-section">
        <h2 class="stats-section-title">${stats.label}</h2>
        <p class="stats-empty">No attempts yet.</p>
      </section>
    `;
  }

  return `
    <section class="stats-section">
      <h2 class="stats-section-title">${stats.label}</h2>
      <dl class="stats-grid">
        <div class="stats-item">
          <dt>Attempts</dt>
          <dd>${stats.attemptCount}</dd>
        </div>
        <div class="stats-item">
          <dt>Attempt pass rate</dt>
          <dd>${stats.attemptPassRatePercent}%</dd>
        </div>
        <div class="stats-item">
          <dt>Questions correct</dt>
          <dd>${stats.questionPassRatePercent}%</dd>
        </div>
        <div class="stats-item">
          <dt>First try</dt>
          <dd>${stats.firstTryRatePercent}%</dd>
        </div>
        <div class="stats-item">
          <dt>Median error</dt>
          <dd>${stats.medianAbsCents}¢</dd>
        </div>
      </dl>
    </section>
  `;
}

export async function mountStats(
  root: HTMLElement,
  deps: MountDeps = {},
): Promise<void> {
  const history = deps.history ?? createDefaultHistoryPort();
  const records = await history.getAllAttempts();
  const stats = computeDashboardStats(records);
  const hasData = stats.totalAttempts > 0;

  root.innerHTML = `
    <main class="app">
      <nav class="nav">
        <a href="/" class="nav-back">← All tests</a>
      </nav>

      <header class="header">
        <h1>Your progress</h1>
        <p class="subtitle">Stats from saved practice attempts</p>
      </header>

      ${
        hasData
          ? `
        <section class="stats-section stats-section-overall">
          <h2 class="stats-section-title">Overall</h2>
          <dl class="stats-grid">
            <div class="stats-item">
              <dt>Total attempts</dt>
              <dd>${stats.totalAttempts}</dd>
            </div>
            <div class="stats-item">
              <dt>Questions practiced</dt>
              <dd>${stats.totalQuestions}</dd>
            </div>
            <div class="stats-item">
              <dt>Attempt pass rate</dt>
              <dd>${stats.attemptPassRatePercent}%</dd>
            </div>
            <div class="stats-item">
              <dt>Questions correct</dt>
              <dd>${stats.questionPassRatePercent}%</dd>
            </div>
            <div class="stats-item">
              <dt>First try</dt>
              <dd>${stats.firstTryRatePercent}%</dd>
            </div>
            <div class="stats-item">
              <dt>Median error</dt>
              <dd>${stats.medianAbsCents}¢</dd>
            </div>
          </dl>
        </section>
        ${stats.byExercise.map(renderExerciseSection).join("")}
      `
          : `
        <section class="card">
          <p class="status">No practice history yet.</p>
          <p class="stats-hint">
            Complete a round on any test — each scored attempt is saved locally in your browser.
          </p>
        </section>
      `
      }

      <nav class="test-list" aria-label="Practice tests">
        <a href="/single-note/" class="test-card">
          <span class="test-card-title">Sing a single note</span>
        </a>
        <a href="/chord-middle/" class="test-card">
          <span class="test-card-title">Sing the middle note of a chord</span>
        </a>
      </nav>
    </main>
  `;
}
