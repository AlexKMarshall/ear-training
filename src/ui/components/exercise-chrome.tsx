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
  lessonProgressHidden: boolean;
  lessonProgressText: string;
}) {
  return (
    <header class="header">
      <h1>{props.title}</h1>
      <p class="subtitle">{props.subtitle}</p>
      <p
        class="round-progress"
        hidden={props.lessonProgressHidden}
      >
        {props.lessonProgressText}
      </p>
    </header>
  );
}

export function ExerciseActionBar(props: {
  playLabel: string;
  playHidden: boolean;
  playDisabled: boolean;
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
