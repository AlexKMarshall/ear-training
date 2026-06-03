import { mountExercise } from "../exercises/registry.ts";
import type { ExerciseId } from "../history/types.ts";

export function mountExercisePage(
  root: HTMLElement,
  exerciseId: ExerciseId,
): void {
  mountExercise(root, exerciseId);
}
