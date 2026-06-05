import type { JSX } from "solid-js";

export function ExerciseNav() {
  return (
    <nav class="nav">
      <a href="/" class="nav-back">
        ← All tests
      </a>
    </nav>
  );
}

export function ExerciseHeader(props: {
  title: string;
  subtitle: string;
  lessonBanner?: string;
  lessonProgressHidden: boolean;
  lessonProgressText: string;
}) {
  return (
    <header class="header">
      <h1>{props.title}</h1>
      <p class="subtitle">{props.subtitle}</p>
      {props.lessonBanner ? (
        <p class="lesson-banner">{props.lessonBanner}</p>
      ) : null}
      <p class="round-progress" hidden={props.lessonProgressHidden}>
        {props.lessonProgressText}
      </p>
    </header>
  );
}

export function ExerciseActionBar(props: {
  playLabel: string;
  playHidden: boolean;
  playDisabled: boolean;
  recordHidden?: boolean;
  recordDisabled?: boolean;
  recordLabel?: string;
  onRecord?: () => void;
  retryHidden: boolean;
  nextHidden: boolean;
  nextLabel: string;
  nextRoundHidden: boolean;
  onPlay: () => void;
  onRetry: () => void;
  onNext: () => void;
  onNextRound: () => void;
}) {
  return (
    <div class="actions">
      <button
        type="button"
        class="btn btn-primary"
        hidden={props.playHidden}
        disabled={props.playDisabled}
        onClick={props.onPlay}
      >
        {props.playLabel}
      </button>
      {props.onRecord ? (
        <button
          type="button"
          class="btn"
          hidden={props.recordHidden}
          disabled={props.recordDisabled}
          onClick={props.onRecord}
        >
          {props.recordLabel ?? "Start singing"}
        </button>
      ) : null}
      <button
        type="button"
        class="btn"
        hidden={props.retryHidden}
        onClick={props.onRetry}
      >
        Try again
      </button>
      <button
        type="button"
        class="btn btn-primary"
        hidden={props.nextHidden}
        onClick={props.onNext}
      >
        {props.nextLabel}
      </button>
      <a class="btn btn-primary" hidden={props.nextRoundHidden} href="/">
        Back to path
      </a>
      <button
        type="button"
        class="btn btn-primary"
        hidden={props.nextRoundHidden}
        onClick={props.onNextRound}
      >
        Start next lesson
      </button>
    </div>
  );
}

export function ExerciseHint(props: { children: JSX.Element }) {
  return <p class="hint">{props.children}</p>;
}
