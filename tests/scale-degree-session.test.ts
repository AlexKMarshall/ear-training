import { describe, expect, it } from "vitest";
import { getEligibleDegreeIds } from "../src/curriculum/curriculum-lessons.ts";
import { getScaleDegreeById } from "../src/scale-degree-config.ts";
import {
  prepareScaleDegreeExercise,
} from "../src/ui/scale-degree-session.ts";
import { attempt, passingThroughHarmonic2bHistory } from "./fixtures/attempts.ts";
import type { SessionPlanner } from "../src/session/planner.ts";

const unlockedHistory = passingThroughHarmonic2bHistory();

describe("prepareScaleDegreeExercise", () => {
  it("uses planner tag and attaches tier metadata", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "fifth",
    };
    const { exercise, lessonTonicMidi } = prepareScaleDegreeExercise(
      unlockedHistory,
      null,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );

    expect(exercise.degreeId).toBe("fifth");
    expect(exercise.contentTierId).toBe("degree-3a");
    expect(exercise.eligibleTagIds).toEqual(getEligibleDegreeIds("degree-3a"));
    expect(exercise.scaleDegree?.tonic.midi).toBe(lessonTonicMidi);
    expect(exercise.target.midi).toBe(lessonTonicMidi + 7);
  });

  it("keeps the same round tonic across questions", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: (_step, records) =>
        records.length === 0 ? "fourth" : "fifth",
    };
    const first = prepareScaleDegreeExercise(
      unlockedHistory,
      null,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );
    const second = prepareScaleDegreeExercise(
      [
        ...unlockedHistory,
        attempt({
          practiceModeId: "scale-degree-sing",
          degreeId: "fourth",
          contentTierId: "degree-3a",
          passed: true,
          attemptNumber: 1,
          centsOff: 5,
        }),
      ],
      first.lessonTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );

    expect(second.lessonTonicMidi).toBe(first.lessonTonicMidi);
    expect(second.exercise.degreeId).toBe("fifth");
    expect(second.exercise.scaleDegree?.tonic.midi).toBe(first.lessonTonicMidi);
  });

  it("resets tonic when round state is cleared", () => {
    const planner: SessionPlanner = {
      planNextExerciseTag: () => "fifth",
    };

    let lessonTonicMidi: number | null = null;
    const first = prepareScaleDegreeExercise(
      unlockedHistory,
      lessonTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );
    lessonTonicMidi = first.lessonTonicMidi;

    lessonTonicMidi = null;
    const second = prepareScaleDegreeExercise(
      unlockedHistory,
      lessonTonicMidi,
      planner,
      { lowMidi: 48, highMidi: 67 },
    );

    expect(second.lessonTonicMidi).toBeTypeOf("number");
  });
});

describe("scaleDegreeQuestionForTag", () => {
  it("builds a question for each tier degree", () => {
    for (const id of getEligibleDegreeIds("degree-3a")) {
      const degree = getScaleDegreeById(id)!;
      const { exercise } = prepareScaleDegreeExercise(
        unlockedHistory,
        60,
        { planNextExerciseTag: () => id },
      );
      expect(exercise.degreeId).toBe(id);
      expect(exercise.target.midi).toBe(60 + degree.semitonesFromTonic);
    }
  });
});
