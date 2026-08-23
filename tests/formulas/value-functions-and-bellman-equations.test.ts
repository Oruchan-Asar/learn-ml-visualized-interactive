import { describe, expect, it } from "vitest";
import {
  vStar,
  qStar,
  checkBellmanOptimality,
  runBellmanChecks,
  STATES,
  GOAL_STATE,
} from "@/lib/math-core/value-functions-and-bellman-equations";

describe("the optimal value function V*", () => {
  it("matches the MDP chapter's always-right values exactly, since right is already optimal", () => {
    expect(vStar(3)).toBe(0);
    expect(vStar(2)).toBeCloseTo(10, 10);
    expect(vStar(1)).toBeCloseTo(8, 10);
    expect(vStar(0)).toBeCloseTo(6.2, 10);
  });
});

describe("the optimal action-value function Q*", () => {
  it("computes exact one-step-lookahead values at state 2", () => {
    expect(qStar(2, "right")).toBeCloseTo(10, 10);
    expect(qStar(2, "left")).toBeCloseTo(6.2, 10);
  });

  it("computes exact one-step-lookahead values at state 0", () => {
    expect(qStar(0, "right")).toBeCloseTo(6.2, 10);
    expect(qStar(0, "left")).toBeCloseTo(4.58, 10);
  });

  it("right always dominates left, matching the always-right optimal policy", () => {
    for (const s of STATES.filter((s) => s !== GOAL_STATE)) {
      expect(qStar(s, "right")).toBeGreaterThan(qStar(s, "left"));
    }
  });
});

describe("the Bellman optimality equation", () => {
  it("holds exactly at every state: V*(s) equals max_a Q*(s,a)", () => {
    for (const check of runBellmanChecks()) {
      expect(check.matches).toBe(true);
    }
  });

  it("picks 'right' as the best action at every non-terminal state", () => {
    for (const s of STATES.filter((s) => s !== GOAL_STATE)) {
      expect(checkBellmanOptimality(s).bestAction).toBe("right");
    }
  });

  it("the terminal state trivially satisfies the equation with value 0", () => {
    const check = checkBellmanOptimality(GOAL_STATE);
    expect(check.maxQ).toBe(0);
    expect(check.vStarValue).toBe(0);
    expect(check.matches).toBe(true);
  });
});
