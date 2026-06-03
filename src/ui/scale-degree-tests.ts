import { playTargetNote } from "../audio/playback.ts";
import { getScaleDegreeById } from "../scale-degree-config.ts";
import {
  pickRandomRoundTonic,
  randomScaleDegreeQuestionForTonic,
  scaleDegreeToSingTestQuestion,
} from "../scale-degree-questions.ts";
import { getActiveNoteRange } from "../voice-ranges.ts";
import { mountSingTest, type SingTestConfig } from "./sing-test.ts";

export function createScaleDegreeSingConfig(): SingTestConfig {
  let roundTonicMidi: number | null = null;

  return {
    exerciseId: "scale-degree-sing",
    title: "Sing scale degrees",
    subtitle:
      "One key per round — hear the tonic, then sing each requested scale degree",
    playButtonLabel: "Play tonic",
    showVoicePicker: true,
    showDegreePicker: true,
    status: {
      idle: "Press Play to hear the tonic for this round.",
      noDegrees: "Select at least one scale degree to begin.",
      playing: "Listen to the tonic…",
      ready: "Sing the degree shown below, then tap Start singing when ready.",
      recording:
        "Singing… tap Done when finished, or pause ~1s after your note to finish automatically.",
      pass: "Correct — tap Next question when you are ready.",
      fail: "Try again on this question (up to 3 tries).",
      failExhausted: "Out of tries — tap Next question to continue the round.",
    },
    onRoundReset: () => {
      roundTonicMidi = null;
    },
    prepareQuestion: () => {
      const range = getActiveNoteRange();
      if (roundTonicMidi === null) {
        roundTonicMidi = pickRandomRoundTonic(range);
      }
      return scaleDegreeToSingTestQuestion(
        randomScaleDegreeQuestionForTonic(roundTonicMidi),
      );
    },
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
}

/** Shared config for tests that override `prepareQuestion`. */
export const scaleDegreeSingConfig = createScaleDegreeSingConfig();

export function mountScaleDegreeSingTest(root: HTMLElement): void {
  mountSingTest(root, createScaleDegreeSingConfig());
}
