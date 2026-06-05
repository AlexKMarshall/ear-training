import type { DashboardStats, PracticeModeStats } from "../history/stats.ts";
import {
  getTagBreakdownConfig,
  tagBreakdownHeading,
  type TagStats,
} from "../history/tag-stats.ts";

function formatMedianCents(value: number | null): string {
  if (value === null) return "—";
  return `${value}¢`;
}

function StatsItem(props: { label: string; value: string | number }) {
  return (
    <div class="stats-item">
      <dt>{props.label}</dt>
      <dd>{props.value}</dd>
    </div>
  );
}

function StatsTagRow(props: { tag: TagStats; showMedian: boolean }) {
  return (
    <div class="stats-tag-row">
      <span class="stats-tag-label">{props.tag.label}</span>
      <dl class="stats-grid stats-grid-compact">
        <StatsItem
          label="Questions correct"
          value={`${props.tag.lessonExercisePassRatePercent}%`}
        />
        <StatsItem
          label="First try"
          value={`${props.tag.firstTryRatePercent}%`}
        />
        {props.showMedian ? (
          <StatsItem
            label="Median error"
            value={formatMedianCents(props.tag.medianAbsCents)}
          />
        ) : null}
      </dl>
    </div>
  );
}

function StatsTagBreakdown(props: { stats: PracticeModeStats }) {
  const config = getTagBreakdownConfig(props.stats.practiceModeId);
  if (!config || !props.stats.byTag?.length) {
    return null;
  }

  const showMedian = config.includeMedianCents;
  return (
    <div class="stats-subsection">
      <h3 class="stats-subsection-title">{tagBreakdownHeading(config.kind)}</h3>
      <p class="stats-hint">Weakest first (by questions correct).</p>
      <div class="stats-tag-list">
        {props.stats.byTag.map((tag) => (
          <StatsTagRow tag={tag} showMedian={showMedian} />
        ))}
      </div>
    </div>
  );
}

function StatsExerciseSection(props: { stats: PracticeModeStats }) {
  if (props.stats.attemptCount === 0) {
    return (
      <section class="stats-section">
        <h2 class="stats-section-title">{props.stats.label}</h2>
        <p class="stats-empty">No attempts yet.</p>
      </section>
    );
  }

  const showMedian = props.stats.medianAbsCents !== null;
  return (
    <section class="stats-section">
      <h2 class="stats-section-title">{props.stats.label}</h2>
      <dl class="stats-grid">
        <StatsItem label="Attempts" value={props.stats.attemptCount} />
        <StatsItem
          label="Attempt pass rate"
          value={`${props.stats.attemptPassRatePercent}%`}
        />
        <StatsItem
          label="Questions correct"
          value={`${props.stats.lessonExercisePassRatePercent}%`}
        />
        <StatsItem
          label="First try"
          value={`${props.stats.firstTryRatePercent}%`}
        />
        {showMedian ? (
          <StatsItem
            label="Median error"
            value={formatMedianCents(props.stats.medianAbsCents)}
          />
        ) : null}
      </dl>
      <StatsTagBreakdown stats={props.stats} />
    </section>
  );
}

function StatsOverallSection(props: {
  stats: DashboardStats;
  hasSingAttempts: boolean;
}) {
  return (
    <section class="stats-section stats-section-overall">
      <h2 class="stats-section-title">Overall</h2>
      <dl class="stats-grid">
        <StatsItem label="Total attempts" value={props.stats.totalAttempts} />
        <StatsItem
          label="Questions practiced"
          value={props.stats.totalLessonExercises}
        />
        <StatsItem
          label="Attempt pass rate"
          value={`${props.stats.attemptPassRatePercent}%`}
        />
        <StatsItem
          label="Questions correct"
          value={`${props.stats.lessonExercisePassRatePercent}%`}
        />
        <StatsItem
          label="First try"
          value={`${props.stats.firstTryRatePercent}%`}
        />
        {props.hasSingAttempts ? (
          <StatsItem
            label="Median error (singing)"
            value={`${props.stats.medianAbsCents}¢`}
          />
        ) : null}
      </dl>
      {props.hasSingAttempts ? null : (
        <p class="stats-hint">
          Median error applies to singing exercises only.
        </p>
      )}
    </section>
  );
}

function StatsPracticeLinks() {
  return (
    <nav class="test-list" aria-label="Practice tests">
      <a href="/single-note/" class="test-card">
        <span class="test-card-title">Sing a single note</span>
      </a>
      <a href="/chord-middle/" class="test-card">
        <span class="test-card-title">Sing the middle note of a chord</span>
      </a>
    </nav>
  );
}

export function StatsView(props: {
  stats: DashboardStats;
  hasSingAttempts: boolean;
}) {
  const hasData = props.stats.totalAttempts > 0;

  return (
    <main class="app">
      <nav class="nav">
        <a href="/" class="nav-back">
          ← All tests
        </a>
      </nav>

      <header class="header">
        <h1>Your progress</h1>
        <p class="subtitle">Stats from saved practice attempts</p>
      </header>

      {hasData ? (
        <>
          <StatsOverallSection
            stats={props.stats}
            hasSingAttempts={props.hasSingAttempts}
          />
          {props.stats.byPracticeMode.map((section) => (
            <StatsExerciseSection stats={section} />
          ))}
        </>
      ) : (
        <section class="card">
          <p class="status">No practice history yet.</p>
          <p class="stats-hint">
            Complete a lesson on any test — each scored attempt is saved locally
            in your browser.
          </p>
        </section>
      )}

      <StatsPracticeLinks />
    </main>
  );
}
