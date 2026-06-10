import { render } from "solid-js/web"
import type { CurriculumLesson } from "../curriculum/curriculum-lessons.ts"
import { CURRICULUM_LESSONS } from "../curriculum/curriculum-lessons.ts"
import {
  formatPathNodeHref,
  formatPathNodeStatus,
  getPathNodeLabels,
  getPathNodeState,
  isGuidedPathComplete,
} from "../curriculum/path-node.ts"
import { createDefaultHistoryPort, type MountDeps } from "../history/port.ts"
import type { AttemptRecord } from "../history/types.ts"
import {
  resolveTargetedPracticeHomeCard,
  type TargetedPracticeHomeCardView,
} from "../session/targeted-practice-home-card.ts"

function pathNodeStateClass(state: ReturnType<typeof getPathNodeState>): string {
  return state === "passed"
    ? "path-node-passed"
    : state === "current"
      ? "path-node-current"
      : "path-node-locked"
}

function PathNode(props: { step: CurriculumLesson; records: readonly AttemptRecord[] }) {
  const state = getPathNodeState(props.step, props.records)
  const stateClass = pathNodeStateClass(state)

  if (state === "locked") {
    return (
      <div class={`path-node ${stateClass}`} data-path-node={state} aria-disabled="true">
        <PathNodeContent step={props.step} records={props.records} />
      </div>
    )
  }

  const href = formatPathNodeHref(props.step)
  return (
    <a
      href={href}
      class={`path-node ${stateClass}`}
      data-path-node={state === "current" ? "current" : undefined}
    >
      <PathNodeContent step={props.step} records={props.records} />
    </a>
  )
}

function PathNodeContent(props: { step: CurriculumLesson; records: readonly AttemptRecord[] }) {
  const { title, subtitle } = getPathNodeLabels(props.step)
  const status = formatPathNodeStatus(props.step, props.records)

  return (
    <>
      <span class="path-node-title">{title}</span>
      <span class="path-node-subtitle">{subtitle}</span>
      <span class="path-node-status">{status}</span>
    </>
  )
}

function TargetedPracticeCard(props: { card: TargetedPracticeHomeCardView }) {
  return (
    <a href="/targeted-practice/" class="targeted-practice-card">
      <span class="targeted-practice-card-title">Targeted practice</span>
      <span class="targeted-practice-card-subtitle">{props.card.subtitle}</span>
      <span class="targeted-practice-card-status">{props.card.status}</span>
      <span class="targeted-practice-card-cta">{props.card.ctaLabel}</span>
    </a>
  )
}

function GuidedPath(props: { records: readonly AttemptRecord[] }) {
  const pathComplete = isGuidedPathComplete(props.records)

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
  )
}

function Home(props: { records: readonly AttemptRecord[] }) {
  const targetedPracticeCard = resolveTargetedPracticeHomeCard(props.records)

  return (
    <main class="app">
      <header class="header">
        <h1>Ear Training</h1>
        <p class="subtitle">Guided path from single notes to intervals</p>
      </header>

      {targetedPracticeCard ? (
        <section class="targeted-practice-entry" aria-label="Targeted practice">
          <TargetedPracticeCard card={targetedPracticeCard} />
        </section>
      ) : null}

      <GuidedPath records={props.records} />

      <nav class="test-list" aria-label="More">
        <a href="/stats/" class="test-card test-card-stats">
          <span class="test-card-title">Your progress</span>
          <span class="test-card-desc">Accuracy, pitch error, and first-try rate</span>
        </a>
      </nav>
    </main>
  )
}

export async function mountHome(root: HTMLElement, deps: MountDeps = {}): Promise<void> {
  const history = deps.history ?? createDefaultHistoryPort()
  const records = await history.getAllAttempts()

  render(() => <Home records={records} />, root)
}
