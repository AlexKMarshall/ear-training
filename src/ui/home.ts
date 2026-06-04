import {
  formatPathNodeHref,
  formatPathNodeStatus,
  getPathNodeLabels,
  getPathNodeState,
  isGuidedPathComplete,
} from "../curriculum/path-node.ts";
import { CURRICULUM_LESSONS } from "../curriculum/curriculum-lessons.ts";
import {
  createDefaultHistoryPort,
  type MountDeps,
} from "../history/port.ts";
import type { AttemptRecord } from "../history/types.ts";

function renderPathNode(
  step: (typeof CURRICULUM_LESSONS)[number],
  records: readonly AttemptRecord[],
): string {
  const { title, subtitle } = getPathNodeLabels(step);
  const state = getPathNodeState(step, records);
  const status = formatPathNodeStatus(step, records);
  const stateClass =
    state === "passed"
      ? "path-node-passed"
      : state === "current"
        ? "path-node-current"
        : "path-node-locked";

  const inner = `
    <span class="path-node-title">${title}</span>
    <span class="path-node-subtitle">${subtitle}</span>
    <span class="path-node-status">${status}</span>
  `;

  if (state === "locked") {
    return `<div class="path-node ${stateClass}" data-path-node="${state}" aria-disabled="true">${inner}</div>`;
  }

  const href = formatPathNodeHref(step);
  const currentAttr = state === "current" ? ' data-path-node="current"' : "";
  return `<a href="${href}" class="path-node ${stateClass}"${currentAttr}>${inner}</a>`;
}

function renderGuidedPath(records: readonly AttemptRecord[]): string {
  const pathComplete = isGuidedPathComplete(records);
  const completeBanner = pathComplete
    ? `<p class="guided-path-complete">You have completed the guided path. Replay any step below.</p>`
    : "";

  const nodes = CURRICULUM_LESSONS.map((step) =>
    renderPathNode(step, records),
  ).join("");

  return `
    <section class="guided-path" aria-label="Guided path">
      ${completeBanner}
      <div class="guided-path-list">
        ${nodes}
      </div>
    </section>
  `;
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

  root.innerHTML = `
    <main class="app">
      <header class="header">
        <h1>Ear Training</h1>
        <p class="subtitle">Guided path from single notes to intervals</p>
      </header>

      ${renderGuidedPath(records)}

      <nav class="test-list" aria-label="More">
        <a href="/stats/" class="test-card test-card-stats">
          <span class="test-card-title">Your progress</span>
          <span class="test-card-desc">Accuracy, pitch error, and first-try rate</span>
        </a>
      </nav>
    </main>
  `;

  scrollCurrentPathNodeIntoView(root);
}
