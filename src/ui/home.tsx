import {
  formatPathNodeHref,
  formatPathNodeStatus,
  getPathNodeLabels,
  getPathNodeState,
  isGuidedPathComplete,
} from "../curriculum/path-node.ts";
import { CURRICULUM_LESSONS } from "../curriculum/curriculum-lessons.ts";
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts";
import { createDefaultHistoryPort, type MountDeps } from "../history/port.ts";
import type { AttemptRecord } from "../history/types.ts";
import { render } from "solid-js/web";

function pathNodeStateClass(
  state: ReturnType<typeof getPathNodeState>,
): string {
  return state === "passed"
    ? "path-node-passed"
    : state === "current"
      ? "path-node-current"
      : "path-node-locked";
}

function PathNode(props: {
  step: CurriculumLesson;
  records: readonly AttemptRecord[];
}) {
  const state = getPathNodeState(props.step, props.records);
  const stateClass = pathNodeStateClass(state);

  if (state === "locked") {
    return (
      <div
        class={`path-node ${stateClass}`}
        data-path-node={state}
        aria-disabled="true"
      >
        <PathNodeContent step={props.step} records={props.records} />
      </div>
    );
  }

  const href = formatPathNodeHref(props.step);
  return (
    <a
      href={href}
      class={`path-node ${stateClass}`}
      data-path-node={state === "current" ? "current" : undefined}
    >
      <PathNodeContent step={props.step} records={props.records} />
    </a>
  );
}

function PathNodeContent(props: {
  step: CurriculumLesson;
  records: readonly AttemptRecord[];
}) {
  const { title, subtitle } = getPathNodeLabels(props.step);
  const status = formatPathNodeStatus(props.step, props.records);

  return (
    <>
      <span class="path-node-title">{title}</span>
      <span class="path-node-subtitle">{subtitle}</span>
      <span class="path-node-status">{status}</span>
    </>
  );
}

function GuidedPath(props: { records: readonly AttemptRecord[] }) {
  const pathComplete = isGuidedPathComplete(props.records);

  return (
    <section class="guided-path" aria-label="Guided path">
      {pathComplete ? (
        <p class="guided-path-complete">
          You have completed the guided path. Replay any step below.
        </p>
      ) : null}
      <div class="guided-path-list">
        {CURRICULUM_LESSONS.map((step) => (
          <PathNode step={step} records={props.records} />
        ))}
      </div>
    </section>
  );
}

export function Home(props: { records: readonly AttemptRecord[] }) {
  return (
    <main class="app">
      <header class="header">
        <h1>Ear Training</h1>
        <p class="subtitle">Guided path from single notes to intervals</p>
      </header>

      <GuidedPath records={props.records} />

      <nav class="test-list" aria-label="More">
        <a href="/stats/" class="test-card test-card-stats">
          <span class="test-card-title">Your progress</span>
          <span class="test-card-desc">
            Accuracy, pitch error, and first-try rate
          </span>
        </a>
      </nav>
    </main>
  );
}

function scrollCurrentPathNodeIntoView(root: HTMLElement): void {
  const current = root.querySelector('[data-path-node="current"]');
  if (!(current instanceof HTMLElement)) {
    return;
  }
  const reducedMotion = globalThis.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  current.scrollIntoView({
    block: "nearest",
    behavior: reducedMotion ? "auto" : "smooth",
  });
}

export async function mountHome(
  root: HTMLElement,
  deps: MountDeps = {},
): Promise<void> {
  const history = deps.history ?? createDefaultHistoryPort();
  const records = await history.getAllAttempts();

  render(() => <Home records={records} />, root);
  scrollCurrentPathNodeIntoView(root);
}
