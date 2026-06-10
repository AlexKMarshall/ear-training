import type { JSX } from "solid-js"
import type { ActionBarState, LessonProgressState } from "../../exercise-screen-state.ts"

export function ExerciseNav(props?: {
  backHref?: string
  backLabel?: string
  onNavigate?: () => void
}) {
  const href = props?.backHref ?? "/"
  const label = props?.backLabel ?? "← Back to path"
  return (
    <nav class="nav">
      <a
        href={href}
        class="nav-back"
        onClick={(event) => {
          if (!props?.onNavigate) return
          event.preventDefault()
          props.onNavigate()
        }}
      >
        {label}
      </a>
    </nav>
  )
}

export function ExerciseHeader(props: {
  title: string
  subtitle: string
  contextBanner?: string
  lessonBanner?: string
  lessonProgress: LessonProgressState
}) {
  return (
    <header class="header">
      <h1>{props.title}</h1>
      <p class="subtitle">{props.subtitle}</p>
      {props.contextBanner ? (
        <p class="lesson-banner targeted-practice-banner">{props.contextBanner}</p>
      ) : null}
      {props.lessonBanner ? <p class="lesson-banner">{props.lessonBanner}</p> : null}
      {props.lessonProgress.visible ? (
        <p class="lesson-progress">{props.lessonProgress.text}</p>
      ) : null}
    </header>
  )
}

const RECORD_LABELS = {
  start: "Start singing",
  done: "Done",
} as const

function AttemptingActionBar(props: {
  actionBar: Extract<ActionBarState, { mode: "attempting" }>
  playButtonLabel: string
  onPlay: () => void
  onRecord?: () => void
}) {
  const inactive = props.actionBar.step === "playing" || props.actionBar.step === "recording"
  return (
    <>
      <button type="button" class="btn btn-primary" disabled={inactive} onClick={props.onPlay}>
        {props.playButtonLabel}
      </button>
      {props.actionBar.record && props.onRecord ? (
        <button type="button" class="btn" onClick={props.onRecord}>
          {RECORD_LABELS[props.actionBar.record]}
        </button>
      ) : null}
    </>
  )
}

export function ExerciseActionBar(props: {
  actionBar: ActionBarState
  playButtonLabel: string
  onPlay: () => void
  onRecord?: () => void
  onRetry: () => void
  onNext: () => void
  onNextLesson: () => void
  summaryBackHref?: string
  summaryBackLabel?: string
}) {
  return (
    <div class="actions">
      {props.actionBar.mode === "attempting" ? (
        <AttemptingActionBar
          actionBar={props.actionBar}
          playButtonLabel={props.playButtonLabel}
          onPlay={props.onPlay}
          onRecord={props.onRecord}
        />
      ) : null}
      {props.actionBar.mode === "result" && props.actionBar.action === "retry" ? (
        <button type="button" class="btn" onClick={props.onRetry}>
          Try again
        </button>
      ) : null}
      {props.actionBar.mode === "result" && props.actionBar.action === "next" ? (
        <button type="button" class="btn btn-primary" onClick={props.onNext}>
          {props.actionBar.nextLabel}
        </button>
      ) : null}
      {props.actionBar.mode === "lesson-summary" ? (
        <>
          <a class="btn btn-primary" href={props.summaryBackHref ?? "/"}>
            {props.summaryBackLabel ?? "Back to path"}
          </a>
          <button type="button" class="btn btn-secondary" onClick={props.onNextLesson}>
            Practice again
          </button>
        </>
      ) : null}
    </div>
  )
}

export function ExerciseHint(props: { children: JSX.Element }) {
  return <p class="hint">{props.children}</p>
}
