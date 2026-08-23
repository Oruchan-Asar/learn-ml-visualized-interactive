import { describe, expect, it } from "vitest";
import {
  runValueIteration,
  bellmanBackup,
  greedyPolicy,
  evaluatePolicy,
  INIT_V,
  STATES,
  GOAL_STATE,
} from "@/lib/math-core/dynamic-programming-policy-value-iteration";

describe("initial value guess", () => {
  it("starts every state, including the goal, at exactly 0", () => {
    for (const s of STATES) expect(INIT_V[s]).toBe(0);
  });
});

describe("value iteration sweeps", () => {
  const steps = runValueIteration(5);

  it("runs exactly 5 sweeps", () => {
    expect(steps.length).toBe(5);
  });

  it("sweep 1 only sees the immediate reward — the goal's +10 shows up at state 2 first", () => {
    expect(steps[0].V[0]).toBeCloseTo(-1, 10);
    expect(steps[0].V[1]).toBeCloseTo(-1, 10);
    expect(steps[0].V[2]).toBeCloseTo(10, 10);
  });

  it("sweep 2 propagates the goal's value one more state back", () => {
    expect(steps[1].V[1]).toBeCloseTo(8, 10);
    expect(steps[1].V[0]).toBeCloseTo(-1.9, 10);
    expect(steps[1].V[2]).toBeCloseTo(10, 10);
  });

  it("sweep 3 reaches the exact optimal value function", () => {
    expect(steps[2].V[0]).toBeCloseTo(6.2, 10);
    expect(steps[2].V[1]).toBeCloseTo(8, 10);
    expect(steps[2].V[2]).toBeCloseTo(10, 10);
  });

  it("sweep 4 changes nothing further — a fixed point has been reached", () => {
    expect(steps[3].changed).toBe(false);
    expect(steps[3].V).toEqual(steps[2].V);
  });
});

describe("the Bellman backup", () => {
  it("at the fixed point, right dominates left at every non-terminal state", () => {
    const converged = runValueIteration(5)[4].V;
    for (const s of STATES.filter((s) => s !== GOAL_STATE)) {
      const backup = bellmanBackup(converged, s);
      expect(backup.bestAction).toBe("right");
    }
  });
});

describe("greedy policy extraction", () => {
  it("recovers 'always right' from the converged value table", () => {
    const converged = runValueIteration(5)[4].V;
    for (const s of STATES.filter((s) => s !== GOAL_STATE)) {
      expect(greedyPolicy(converged, s)).toBe("right");
    }
  });
});

describe("policy evaluation", () => {
  it("evaluating 'always right' converges to the same optimal values value iteration found", () => {
    const V = evaluatePolicy(() => "right", 15);
    expect(V[0]).toBeCloseTo(6.2, 6);
    expect(V[1]).toBeCloseTo(8, 6);
    expect(V[2]).toBeCloseTo(10, 6);
  });

  it("evaluating 'always left' converges to a much worse fixed point", () => {
    const V = evaluatePolicy(() => "left", 200);
    expect(V[0]).toBeCloseTo(-10, 3);
  });
});
