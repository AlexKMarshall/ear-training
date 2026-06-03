import { playTargetNote } from "../audio/playback.ts";
import { randomScaleDegreeSingQuestion } from "../scale-degree-questions.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";
import { mountSingTest, type SingTestConfig } from "./sing-test.ts";

export const scaleDegreeSingConfig: SingTestConfig = {
  exerciseId: "scale-degree-sing",
  title: "Sing scale degrees",
  subtitle: "Hear the tonic, then sing the requested scale degree in that key",
  playButtonLabel: "Play tonic",
  showVoicePicker: true,
  showDegreePicker: true,
  status: {
    idle: "Press Play to hear the tonic.",
    noDegrees: "Select at least one scale degree to begin.",
    playing: "Listen to the tonic…",
    ready: "Sing the degree shown below, then tap Start singing when ready.",
    recording:
      "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
    pass: "Correct — tap Next question when you are ready.",
    fail: "Try again on this question (up to 3 tries).",
    failExhausted: "Out of tries — tap Next question to continue the round.",
  },
  prepareQuestion: () => randomScaleDegreeSingQuestion(getActiveNoteRange()),
  playReference: (question) => {
    if (!question.scaleDegree) {
      throw new Error("Missing scale degree for playback");
    }
    return playTargetNote(question.scaleDegree.tonic.midi);
  },
  questionPrompt: (question) => {
    const label =
      getScaleDegreeById(question.degreeId ?? "")?.label ?? question.degreeId;
    return `Sing the ${label}`;
  },
};

export function mountScaleDegreeSingTest(root: HTMLElement): void {
  mountSingTest(root, scaleDegreeSingConfig);
}
