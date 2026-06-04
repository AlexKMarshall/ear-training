import { describe, expect, it } from "vitest";
import { getEligibleDegreeIds } from "../src/curriculum/steps.ts";
import { getScaleDegreeById } from "../src/scale-degree-config.ts";
import {
  prepareScaleDegreeQuestion,
} from "../src/ui/scale-degree-session.ts";
import { attempt, passingThroughHarmonic2bHistory } from "./fixtures/attempts.ts";
import type { SessionPlanner } from "../src/session/planner.ts";

const unlockedHistory = passingThroughHarmonic2bHistory();

describe("prepareScaleDegreeQuestion", () => {
  it("uses planner tag and attaches tier metadata", () => {
    const planner: SessionPlanner = {
      planNextQuestionTag: () => "fifth",
    };
    const { question, roundTonicMidi } = prepareScaleDegreeQuestion(
      unlockedHistory,
      null,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );

    expect(question.degreeId).toBe("fifth");
    expect(question.contentTierId).toBe("degree-3a");
    expect(question.eligibleTagIds).toEqual(getEligibleDegreeIds("degree-3a"));
    expect(question.scaleDegree?.tonic.midi).toBe(roundTonicMidi);
    expect(question.target.midi).toBe(roundTonicMidi + 7);
  });

  it("keeps the same round tonic across questions", () => {
    const planner: SessionPlanner = {
      planNextQuestionTag: (_step, records) =>
        records.length === 0 ? "fourth" : "fifth",
    };
    const first = prepareScaleDegreeQuestion(
      unlockedHistory,
      null,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );
    const second = prepareScaleDegreeQuestion(
      [
        ...unlockedHistory,
        attempt({
          exerciseId: "scale-degree-sing",
          degreeId: "fourth",
          contentTierId: "degree-3a",
          passed: true,
          attemptNumber: 1,
          centsOff: 5,
        }),
      ],
      first.roundTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );

    expect(second.roundTonicMidi).toBe(first.roundTonicMidi);
    expect(second.question.degreeId).toBe("fifth");
    expect(second.question.scaleDegree?.tonic.midi).toBe(first.roundTonicMidi);
  });

  it("resets tonic when round state is cleared", () => {
    const planner: SessionPlanner = {
      planNextQuestionTag: () => "fifth",
    };

    let roundTonicMidi: number | null = null;
    const first = prepareScaleDegreeQuestion(
      unlockedHistory,
      roundTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );
    roundTonicMidi = first.roundTonicMidi;

    roundTonicMidi = null;
    const second = prepareScaleDegreeQuestion(
      unlockedHistory,
      roundTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );

    expect(second.roundTonicMidi).toBeTypeOf("number");
  });
});

describe("scaleDegreeQuestionForTag", () => {
  it("builds a question for each tier degree", () => {
    for (const id of getEligibleDegreeIds("degree-3a")) {
      const degree = getScaleDegreeById(id)!;
      const { question } = prepareScaleDegreeQuestion(
        unlockedHistory,
        60,
        { planNextQuestionTag: () => id },
      );
      expect(question.degreeId).toBe(id);
      expect(question.target.midi).toBe(60 + degree.semitonesFromTonic);
    }
  });
});
