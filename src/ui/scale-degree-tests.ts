import { playTargetNote } from "../audio/playback.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import { mountSingTest, type SingMountDeps, type SingTestConfig } from "./sing-test.ts";
import {
  prepareScaleDegreeExercise,
  resolveScaleDegreeSession,
  type ScaleDegreeSessionDeps,
} from "./scale-degree-session.ts";

const scaleDegreeSingBase = {
  practiceModeId: "scale-degree-sing" as const,
  title: "Sing scale degrees",
  subtitle:
    "One key per lesson — hear the tonic, then sing each requested scale degree",
  playButtonLabel: "Play tonic",
  showVoicePicker: true,
  status: {
    idle: "Press Play to hear the tonic for this lesson.",
    playing: "Listen to the tonic…",
    ready: "Sing the degree shown below, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next exercise when you are ready.",
    fail: "Try again on this exercise (up to 3 tries).",
    failExhausted: "Out of tries — tap Next exercise to continue the lesson.",
  },
  playReference: (exercise: Parameters<SingTestConfig["playReference"]>[0]) => {
    if (!exercise.scaleDegree) {
      throw new Error("Missing scale degree for playback");
    }
    return playTargetNote(exercise.scaleDegree.tonic.midi);
  },
  exercisePrompt: (exercise: Parameters<NonNullable<SingTestConfig["exercisePrompt"]>>[0]) => {
    const label =
      getScaleDegreeById(exercise.degreeId ?? "")?.label ?? exercise.degreeId;
    return `Sing the ${label}`;
  },
};

export const scaleDegreeSingConfig: SingTestConfig = {
  ...scaleDegreeSingBase,
  prepareExercise: () =>
    prepareScaleDegreeExercise([], null).exercise,
};

export function mountScaleDegreeSingTest(
  root: HTMLElement,
  deps?: ScaleDegreeSessionDeps & SingMountDeps,
): void {
  const { cache, planner } = resolveScaleDegreeSession(deps);
  let lessonTonicMidi: number | null = null;

  mountSingTest(
    root,
    {
      ...scaleDegreeSingBase,
      onLessonReset: () => {
        lessonTonicMidi = null;
      },
      prepareExercise: () => {
        const result = prepareScaleDegreeExercise(
          cache.getRecords(),
          lessonTonicMidi,
          planner,
          undefined,
          deps?.sessionCurriculumLesson,
        );
        lessonTonicMidi = result.lessonTonicMidi;
        return result.exercise;
      },
    },
    { ...deps, history: cache.historyPort },
  );
}
