import { playTargetNote } from "../audio/playback.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import { mountSingTest, type SingMountDeps, type SingTestConfig } from "./sing-test.ts";
import {
  prepareScaleDegreeQuestion,
  resolveScaleDegreeSession,
  type ScaleDegreeSessionDeps,
} from "./scale-degree-session.ts";

const scaleDegreeSingBase = {
  exerciseId: "scale-degree-sing" as const,
  title: "Sing scale degrees",
  subtitle:
    "One key per round — hear the tonic, then sing each requested scale degree",
  playButtonLabel: "Play tonic",
  showVoicePicker: true,
  showDegreePicker: false,
  status: {
    idle: "Press Play to hear the tonic for this round.",
    noDegrees: "",
    playing: "Listen to the tonic…",
    ready: "Sing the degree shown below, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  playReference: (question: Parameters<SingTestConfig["playReference"]>[0]) => {
    if (!question.scaleDegree) {
      throw new Error("Missing scale degree for playback");
    }
    return playTargetNote(question.scaleDegree.tonic.midi);
  },
  questionPrompt: (question: Parameters<NonNullable<SingTestConfig["questionPrompt"]>>[0]) => {
    const label =
      getScaleDegreeById(question.degreeId ?? "")?.label ?? question.degreeId;
    return `Sing the ${label}`;
  },
};

export const scaleDegreeSingConfig: SingTestConfig = {
  ...scaleDegreeSingBase,
  prepareQuestion: () =>
    prepareScaleDegreeQuestion([], null).question,
};

export function mountScaleDegreeSingTest(
  root: HTMLElement,
  deps?: ScaleDegreeSessionDeps & SingMountDeps,
): void {
  const { cache, planner } = resolveScaleDegreeSession(deps);
  let roundTonicMidi: number | null = null;

  mountSingTest(
    root,
    {
      ...scaleDegreeSingBase,
      onRoundReset: () => {
        roundTonicMidi = null;
      },
      prepareQuestion: () => {
        const result = prepareScaleDegreeQuestion(
          cache.getRecords(),
          roundTonicMidi,
          planner,
        );
        roundTonicMidi = result.roundTonicMidi;
        return result.question;
      },
    },
    { ...deps, history: cache.historyPort },
  );
}
