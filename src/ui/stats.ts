import { getPracticeMode } from "../practice-modes/registry.ts";
import { isPracticeModeId } from "../history/normalize.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import { computeDashboardStats, type PracticeModeStats } from "../history/stats.ts";
import {
  getTagBreakdownConfig,
  tagBreakdownHeading,
  type TagStats,
} from "../history/tag-stats.ts";
function formatMedianCents(value: number | null): string {
  if (value === null) return "—";
  return `${value}¢`;
}

function renderTagRow(tag: TagStats, showMedian: boolean): string {
  return `
    <div class="stats-tag-row">
      <span class="stats-tag-label">${tag.label}</span>
      <dl class="stats-grid stats-grid-compact">
        <div class="stats-item">
          <dt>Questions correct</dt>
          <dd>${tag.lessonExercisePassRatePercent}%</dd>
        </div>
        <div class="stats-item">
          <dt>First try</dt>
          <dd>${tag.firstTryRatePercent}%</dd>
        </div>
        ${
          showMedian
            ? `
        <div class="stats-item">
          <dt>Median error</dt>
          <dd>${formatMedianCents(tag.medianAbsCents)}</dd>
        </div>
        `
            : ""
        }
      </dl>
    </div>
  `;
}

function renderTagBreakdown(stats: PracticeModeStats): string {
  const config = getTagBreakdownConfig(stats.practiceModeId);
  if (!config || !stats.byTag?.length) return "";

  const showMedian = config.includeMedianCents;
  return `
    <div class="stats-subsection">
      <h3 class="stats-subsection-title">${tagBreakdownHeading(config.kind)}</h3>
      <p class="stats-hint">Weakest first (by questions correct).</p>
      <div class="stats-tag-list">
        ${stats.byTag.map((tag) => renderTagRow(tag, showMedian)).join("")}
      </div>
    </div>
  `;
}

function renderExerciseSection(stats: PracticeModeStats): string {
  if (stats.attemptCount === 0) {
    return `
      <section class="stats-section">
        <h2 class="stats-section-title">${stats.label}</h2>
        <p class="stats-empty">No attempts yet.</p>
      </section>
    `;
  }

  const showMedian = stats.medianAbsCents !== null;

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
          <dd>${stats.lessonExercisePassRatePercent}%</dd>
        </div>
        <div class="stats-item">
          <dt>First try</dt>
          <dd>${stats.firstTryRatePercent}%</dd>
        </div>
        ${
          showMedian
            ? `
        <div class="stats-item">
          <dt>Median error</dt>
          <dd>${formatMedianCents(stats.medianAbsCents)}</dd>
        </div>
        `
            : ""
        }
      </dl>
      ${renderTagBreakdown(stats)}
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
  const hasSingAttempts = records.some(
    (r) =>
      isPracticeModeId(r.practiceModeId) &&
      getPracticeMode(r.practiceModeId).responseMode === "sing",
  );

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
              <dd>${stats.totalLessonExercises}</dd>
            </div>
            <div class="stats-item">
              <dt>Attempt pass rate</dt>
              <dd>${stats.attemptPassRatePercent}%</dd>
            </div>
            <div class="stats-item">
              <dt>Questions correct</dt>
              <dd>${stats.lessonExercisePassRatePercent}%</dd>
            </div>
            <div class="stats-item">
              <dt>First try</dt>
              <dd>${stats.firstTryRatePercent}%</dd>
            </div>
            ${
              hasSingAttempts
                ? `
            <div class="stats-item">
              <dt>Median error (singing)</dt>
              <dd>${stats.medianAbsCents}¢</dd>
            </div>
            `
                : ""
            }
          </dl>
          ${
            hasSingAttempts
              ? ""
              : `<p class="stats-hint">Median error applies to singing exercises only.</p>`
          }
        </section>
        ${stats.byPracticeMode.map(renderExerciseSection).join("")}
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
