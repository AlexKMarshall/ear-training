import { batch, createSignal, Show } from "solid-js"
import { render } from "solid-js/web"
import { createDefaultAudioPort } from "../audio/port.ts"
import { EXERCISES_PER_LESSON } from "../config.ts"
import type { ExerciseDefinition } from "../exercise-definition.ts"
import { isSingExerciseDefinition } from "../exercise-definition.ts"
import { createDefaultHistoryPort, type MountDeps } from "../history/port.ts"
import { createSessionHistoryCache } from "../history/session-cache.ts"
import { LessonRun, type LessonRunInitialState } from "../lesson-run.ts"
import { getPracticeMode, type ResponseMode } from "../practice-modes/registry.ts"
import { formatTargetedPracticeContextBanner } from "../session/targeted-practice-banner.ts"
import {
  applyPreparedExerciseContext,
  buildTargetedPracticeSlotDefinition,
} from "../session/targeted-practice-definition.ts"
import {
  prepareTargetedPracticeSlotExercise,
  slotIndexFromLessonRun,
} from "../session/targeted-practice-exercise.ts"
import type {
  TargetedPracticePlan,
  TargetedPracticeSlot,
} from "../session/targeted-practice-planner.ts"
import { planTargetedPracticeLesson } from "../session/targeted-practice-planner.ts"
import {
  clearTargetedPracticeSession,
  loadTargetedPracticeSession,
  saveTargetedPracticeSession,
  updateTargetedPracticeLessonRun,
} from "../session/targeted-practice-session-store.ts"
import { getActiveNoteRange } from "../voice-ranges.ts"
import { IdentifyTestView } from "./identify-test-view.tsx"
import {
  createSelectExerciseOrchestrator,
  createSingExerciseOrchestrator,
  type ExerciseMountDeps,
  type SelectExerciseOrchestrator,
  type SingExerciseOrchestrator,
} from "./mount-exercise.ts"
import { SingTestView } from "./sing-test-view.tsx"

function TargetedPracticeUnavailableView() {
  return (
    <main class="app">
      <nav class="nav">
        <a href="/" class="nav-back">
          ← Back to home
        </a>
      </nav>
      <header class="header">
        <h1>Targeted practice</h1>
        <p class="subtitle">Pass more path lessons to unlock a recommended practice session.</p>
      </header>
    </main>
  )
}

function lessonRunInitialStateFromSnapshot(lesson: {
  lessonId: string
  currentExerciseIndex: number | null
  scoredAttemptsOnCurrent: number
  lastPassed: boolean
  results: LessonRunInitialState["results"]
}): LessonRunInitialState {
  return {
    lessonId: lesson.lessonId,
    currentExerciseIndex: lesson.currentExerciseIndex,
    scoredAttemptsOnCurrent: lesson.scoredAttemptsOnCurrent,
    lastPassed: lesson.lastPassed,
    results: lesson.results,
  }
}

function responseModeForSlot(slot: TargetedPracticeSlot): ResponseMode {
  return getPracticeMode(slot.practiceModeId).responseMode
}

const targetedPracticeChrome = {
  navBackHref: "/",
  navBackLabel: "← Abandon practice",
  summaryBackHref: "/",
  summaryBackLabel: "Back to home",
} as const

interface TargetedPracticeLessonProps {
  plan: TargetedPracticePlan
  initialLessonRun: LessonRunInitialState
  deps: ExerciseMountDeps
  onAbandon: () => void
  onLessonFinished: () => void
  onStartFreshLesson: (plan: TargetedPracticePlan, lessonRun: LessonRunInitialState) => void
}

function TargetedPracticeLesson(props: TargetedPracticeLessonProps) {
  const audio = props.deps.audio ?? createDefaultAudioPort()
  const contextBanner = formatTargetedPracticeContextBanner(
    props.plan.family,
    props.plan.focusTagLabels,
  )

  const exerciseContext = {
    records: props.deps.sessionHistory?.getRecords() ?? [],
    rng: Math.random,
    range: getActiveNoteRange(),
    lessonTonicMidi: null as number | null,
    lastScaleDegreeStepKey: null as string | null,
  }

  function slotForLessonIndex(index: number): TargetedPracticeSlot {
    const slot = props.plan.slots[index]
    if (!slot) {
      throw new Error(`Missing targeted practice slot at index ${index}`)
    }
    return slot
  }

  function buildDefinitionForIndex(index: number): ExerciseDefinition {
    const slot = slotForLessonIndex(index)
    return buildTargetedPracticeSlotDefinition(
      slot,
      () => {
        const prepared = prepareTargetedPracticeSlotExercise(slot, {
          ...exerciseContext,
          records: props.deps.sessionHistory?.getRecords() ?? [],
        })
        applyPreparedExerciseContext(exerciseContext, prepared)
        return prepared.exercise
      },
      () => {
        exerciseContext.lessonTonicMidi = null
        exerciseContext.lastScaleDegreeStepKey = null
      },
    )
  }

  function createOrchestrator(lessonRun: LessonRunInitialState): {
    mode: ResponseMode
    orchestrator: SingExerciseOrchestrator | SelectExerciseOrchestrator
    definition: ExerciseDefinition
  } {
    const index = slotIndexFromLessonRun(lessonRun.currentExerciseIndex, lessonRun.results.length)
    const slot = slotForLessonIndex(index)
    const mode = responseModeForSlot(slot)
    const mountDeps: ExerciseMountDeps = {
      ...props.deps,
      initialLessonRunState: lessonRun,
      exercisesPerLesson: props.deps.exercisesPerLesson ?? EXERCISES_PER_LESSON,
      onLessonRunSnapshot: (snapshot) => {
        updateTargetedPracticeLessonRun(snapshot)
      },
    }

    const definition = buildDefinitionForIndex(index)
    if (mode === "sing") {
      if (!isSingExerciseDefinition(definition)) {
        throw new Error("Expected sing definition")
      }
      const orchestrator = createSingExerciseOrchestrator(definition, mountDeps)
      return { mode, orchestrator, definition }
    }
    if (isSingExerciseDefinition(definition)) {
      throw new Error("Expected select definition")
    }
    return {
      mode,
      orchestrator: createSelectExerciseOrchestrator(definition, mountDeps),
      definition,
    }
  }

  const initial = createOrchestrator(props.initialLessonRun)
  const [responseMode, setResponseMode] = createSignal<ResponseMode>(initial.mode)
  const [orchestrator, setOrchestrator] = createSignal(initial.orchestrator)
  const [definition, setDefinition] = createSignal(initial.definition)

  function rebuildOrchestratorForLessonState(lessonState: LessonRunInitialState): void {
    const next = createOrchestrator(lessonState)
    batch(() => {
      setResponseMode(next.mode)
      setOrchestrator(next.orchestrator)
      setDefinition(next.definition)
    })
    next.orchestrator.syncUiFromScreen()
  }

  function handleNext(): void {
    const current = orchestrator()
    if ("stopRecordingStream" in current) {
      current.stopRecordingStream()
    } else {
      current.resetChoiceState()
    }

    const lessonComplete = current.screen.advanceLessonOnly()
    const snapshot = current.screen.getSnapshot()
    updateTargetedPracticeLessonRun(snapshot.lesson)

    if (lessonComplete) {
      current.syncUiFromScreen()
      props.onLessonFinished()
      return
    }

    rebuildOrchestratorForLessonState(lessonRunInitialStateFromSnapshot(snapshot.lesson))
  }

  function handleAbandon(): void {
    props.onAbandon()
  }

  async function handleNextLesson(): Promise<void> {
    const records = props.deps.sessionHistory?.getRecords() ?? []
    const plan = planTargetedPracticeLesson(records)
    if (!plan) {
      return
    }
    const run = new LessonRun()
    run.ensureCurrentExercise()
    saveTargetedPracticeSession(plan, run.getSnapshot())
    props.onStartFreshLesson(plan, run.getSnapshot())
  }

  return (
    <Show
      when={responseMode() === "sing"}
      fallback={
        <IdentifyExercise
          orchestrator={orchestrator() as SelectExerciseOrchestrator}
          definition={definition()}
          audio={audio}
          contextBanner={contextBanner}
          onAbandon={handleAbandon}
          onNext={handleNext}
          onNextLesson={() => void handleNextLesson()}
        />
      }
    >
      <SingExercise
        orchestrator={orchestrator() as SingExerciseOrchestrator}
        definition={definition()}
        audio={audio}
        contextBanner={contextBanner}
        onAbandon={handleAbandon}
        onNext={handleNext}
        onNextLesson={() => void handleNextLesson()}
      />
    </Show>
  )
}

function SingExercise(props: {
  orchestrator: SingExerciseOrchestrator
  definition: ExerciseDefinition
  audio: ReturnType<typeof createDefaultAudioPort>
  contextBanner: string
  onAbandon: () => void
  onNext: () => void
  onNextLesson: () => void
}) {
  if (!isSingExerciseDefinition(props.definition)) {
    throw new Error("Expected sing definition")
  }
  const definition = props.definition
  props.orchestrator.syncUiFromScreen()

  return (
    <SingTestView
      ui={props.orchestrator.ui}
      title={definition.title}
      subtitle={definition.subtitle}
      contextBanner={props.contextBanner}
      lessonBanner={definition.lessonBanner}
      playButtonLabel={definition.playButtonLabel}
      showVoicePicker={definition.showVoicePicker}
      navBackHref={targetedPracticeChrome.navBackHref}
      navBackLabel={targetedPracticeChrome.navBackLabel}
      onNavNavigate={props.onAbandon}
      summaryBackHref={targetedPracticeChrome.summaryBackHref}
      summaryBackLabel={targetedPracticeChrome.summaryBackLabel}
      onPlay={() => {
        props.audio.unlock()
        void props.orchestrator.screen.play()
      }}
      onRecord={() => {
        props.audio.unlock()
        void props.orchestrator.screen.toggleRecording()
      }}
      onRetry={() => {
        props.orchestrator.stopRecordingStream()
        void props.orchestrator.screen.retry()
      }}
      onNext={props.onNext}
      onNextLesson={props.onNextLesson}
      onVoiceChange={props.orchestrator.handleVoiceChange}
    />
  )
}

function IdentifyExercise(props: {
  orchestrator: SelectExerciseOrchestrator
  definition: ExerciseDefinition
  audio: ReturnType<typeof createDefaultAudioPort>
  contextBanner: string
  onAbandon: () => void
  onNext: () => void
  onNextLesson: () => void
}) {
  if (isSingExerciseDefinition(props.definition)) {
    throw new Error("Expected select definition")
  }
  const definition = props.definition
  props.orchestrator.syncUiFromScreen()

  return (
    <IdentifyTestView
      ui={props.orchestrator.ui}
      title={definition.title}
      subtitle={definition.subtitle}
      contextBanner={props.contextBanner}
      lessonBanner={definition.lessonBanner}
      playButtonLabel={definition.playButtonLabel}
      showVoicePicker={definition.showVoicePicker}
      navBackHref={targetedPracticeChrome.navBackHref}
      navBackLabel={targetedPracticeChrome.navBackLabel}
      onNavNavigate={props.onAbandon}
      summaryBackHref={targetedPracticeChrome.summaryBackHref}
      summaryBackLabel={targetedPracticeChrome.summaryBackLabel}
      onPlay={() => {
        props.audio.unlock()
        void props.orchestrator.screen.play()
      }}
      onRetry={() => {
        props.orchestrator.enableChoicesForRetry()
        void props.orchestrator.screen.retry()
      }}
      onNext={props.onNext}
      onNextLesson={props.onNextLesson}
      onVoiceChange={props.orchestrator.handleVoiceChange}
      onChoice={(choiceId) => {
        void props.orchestrator.handleChoice(choiceId)
      }}
    />
  )
}

export interface TargetedPracticeMountDeps extends MountDeps, ExerciseMountDeps {}

export async function mountTargetedPractice(
  root: HTMLElement,
  deps: TargetedPracticeMountDeps = {},
): Promise<void> {
  const port = deps.history ?? createDefaultHistoryPort()
  const sessionHistory =
    deps.sessionHistory ??
    createSessionHistoryCache(port, {
      initialRecords: await port.getAllAttempts(),
    })
  const mountDeps: ExerciseMountDeps = {
    ...deps,
    sessionHistory,
    history: sessionHistory.historyPort,
  }

  function renderUnavailable(): void {
    render(() => <TargetedPracticeUnavailableView />, root)
  }

  let session = loadTargetedPracticeSession()
  if (!session) {
    const plan = planTargetedPracticeLesson(sessionHistory.getRecords())
    if (!plan) {
      renderUnavailable()
      return
    }
    const run = new LessonRun()
    run.ensureCurrentExercise()
    saveTargetedPracticeSession(plan, run.getSnapshot())
    session = loadTargetedPracticeSession()
  }

  if (!session) {
    renderUnavailable()
    return
  }

  let plan = session.plan
  let lessonRun = session.lessonRun

  function renderLesson(): void {
    render(
      () => (
        <TargetedPracticeLesson
          plan={plan}
          initialLessonRun={lessonRun}
          deps={mountDeps}
          onAbandon={() => {
            clearTargetedPracticeSession()
          }}
          onLessonFinished={() => {
            clearTargetedPracticeSession()
          }}
          onStartFreshLesson={(nextPlan, nextLessonRun) => {
            plan = nextPlan
            lessonRun = nextLessonRun
            renderLesson()
          }}
        />
      ),
      root,
    )
  }

  renderLesson()
}
