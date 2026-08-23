/**
 * Environment feedback is the ground truth that comes back from actually running an attempt — a test
 * result, a stack trace, stdout — as opposed to the model's own belief about whether it succeeded.
 * Reflexion adds one more step on top of that: instead of retrying blind, the agent writes a short
 * verbal self-critique from (attempt, feedback) and carries that critique into the next attempt as
 * extra context. The loop is attempt -> feedback -> reflexion -> retry, and it only works because the
 * feedback is real (the code actually ran) — a model guessing at its own failure has nothing to reflect on.
 */
export interface ReflexionTask {
  name: string;
  nums: number[];
}

/** Four instances of the same buggy "average" task. The last one is a trap: its bug never surfaces. */
export const TASKS: ReflexionTask[] = [
  { name: "[2, 4, 6]", nums: [2, 4, 6] },
  { name: "[10, 20, 30, 40]", nums: [10, 20, 30, 40] },
  { name: "[5, 5, 5, 5, 5]", nums: [5, 5, 5, 5, 5] },
  { name: "[7]", nums: [7] },
];

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export function trueAverage(nums: number[]): number {
  return sum(nums) / nums.length;
}

/** Attempt 1's buggy implementation: returns the sum, having forgotten to divide by the count. */
export function attempt1Result(nums: number[]): number {
  return sum(nums);
}

/** Attempt 2's fixed implementation, written only after the reflexion note points at the missing division. */
export function attempt2Result(nums: number[]): number {
  return trueAverage(nums);
}

/** Whether attempt 1's test happens to pass despite the bug — true only when sum and average coincide (a list of length 1). */
export function attempt1Passes(task: ReflexionTask): boolean {
  return attempt1Result(task.nums) === trueAverage(task.nums);
}

export function errorMessage(task: ReflexionTask): string {
  return `AssertionError: expected ${trueAverage(task.nums)}, got ${attempt1Result(task.nums)}`;
}

export function reflexionNote(task: ReflexionTask): string {
  return `My function returned ${attempt1Result(task.nums)}, which is the sum of the ${task.nums.length} number(s), not their average. I forgot to divide by len(nums) — I should divide the sum by ${task.nums.length}.`;
}

export interface ReflexionStep {
  label: string;
  detail: string;
}

/** Builds the fixed 4-step attempt -> feedback -> reflexion -> retry trace for a task whose bug is caught (attempt 1 fails). */
export function buildTrace(task: ReflexionTask): ReflexionStep[] {
  return [
    {
      label: "Attempt 1",
      detail: `def average(nums): return sum(nums)\n\naverage(${task.name}) -> ${attempt1Result(task.nums)}`,
    },
    {
      label: "Environment feedback",
      detail: errorMessage(task),
    },
    {
      label: "Reflexion",
      detail: reflexionNote(task),
    },
    {
      label: "Attempt 2",
      detail: `def average(nums): return sum(nums) / len(nums)\n\naverage(${task.name}) -> ${attempt2Result(task.nums)}  (test passes)`,
    },
  ];
}
