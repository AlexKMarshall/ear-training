export function LockedCurriculumLessonView(props: {
  title: string
  subtitle: string
  predecessorName: string
  minExercisesForUnlock: number
  minPassRatePercent: number
  predecessorHref: string
}) {
  return (
    <main class="app">
      <nav class="nav">
        <a href="/" class="nav-back">
          ← Back to path
        </a>
      </nav>

      <header class="header">
        <h1>{props.title}</h1>
        <p class="subtitle">{props.subtitle}</p>
      </header>

      <section class="exercise-locked" aria-labelledby="exercise-locked-heading">
        <h2 id="exercise-locked-heading" class="exercise-locked-title">
          Locked
        </h2>
        <p class="exercise-locked-desc">
          Complete <strong>{props.predecessorName}</strong> first: answer at least{" "}
          {props.minExercisesForUnlock} questions with {props.minPassRatePercent}% or higher
          question pass rate.
        </p>
        <a href={props.predecessorHref} class="test-card exercise-locked-cta">
          <span class="test-card-title">Go to {props.predecessorName}</span>
          <span class="test-card-desc">Continue the guided path</span>
        </a>
      </section>
    </main>
  )
}
