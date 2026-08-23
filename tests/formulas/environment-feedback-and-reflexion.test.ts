import { describe, it, expect } from "vitest";
import {
  TASKS,
  sum,
  trueAverage,
  attempt1Result,
  attempt2Result,
  attempt1Passes,
  errorMessage,
  reflexionNote,
  buildTrace,
} from "@/lib/math-core/environment-feedback-and-reflexion";

describe("environment-feedback-and-reflexion", () => {
  it("computes sum and true average for [2, 4, 6]", () => {
    expect(sum([2, 4, 6])).toBe(12);
    expect(trueAverage([2, 4, 6])).toBe(4);
  });

  it("attempt 1 returns the sum, not the average, and fails the test for [2, 4, 6]", () => {
    expect(attempt1Result([2, 4, 6])).toBe(12);
    expect(attempt1Passes(TASKS[0])).toBe(false);
  });

  it("attempt 2 divides by length and matches the true average for [10, 20, 30, 40]", () => {
    expect(attempt2Result([10, 20, 30, 40])).toBe(25);
    expect(trueAverage([10, 20, 30, 40])).toBe(25);
  });

  it("formats the error message with the exact expected/got values", () => {
    expect(errorMessage(TASKS[0])).toBe("AssertionError: expected 4, got 12");
  });

  it("the reflexion note names the missing division by the exact count", () => {
    expect(reflexionNote(TASKS[0])).toContain("divide the sum by 3");
  });

  it("the single-element task is a trap: attempt 1 passes despite the same bug being present", () => {
    const trap = TASKS[3];
    expect(trap.nums).toEqual([7]);
    expect(attempt1Result(trap.nums)).toBe(7);
    expect(trueAverage(trap.nums)).toBe(7);
    expect(attempt1Passes(trap)).toBe(true);
  });

  it("every non-trap task in this chapter actually needs the fix", () => {
    for (const task of TASKS.slice(0, 3)) {
      expect(attempt1Passes(task)).toBe(false);
      expect(attempt2Result(task.nums)).toBe(trueAverage(task.nums));
    }
  });

  it("builds a 4-step trace in the fixed attempt -> feedback -> reflexion -> retry order", () => {
    const steps = buildTrace(TASKS[0]);
    expect(steps).toHaveLength(4);
    expect(steps.map((s) => s.label)).toEqual(["Attempt 1", "Environment feedback", "Reflexion", "Attempt 2"]);
    expect(steps[3].detail).toContain("4");
  });
});
