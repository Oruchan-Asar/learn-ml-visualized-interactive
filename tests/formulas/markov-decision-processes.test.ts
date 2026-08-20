import { describe, expect, it } from "vitest";
import {
  transition,
  reward,
  isTerminal,
  valueOfAlwaysRight,
  valueOfStuckAtZero,
  simulate,
  discountedReturn,
  ALWAYS_RIGHT,
  ALWAYS_LEFT,
} from "@/lib/math-core/markov-decision-processes";

describe("the tiny gridworld's dynamics", () => {
  it("moving right increases state, clamped at the goal", () => {
    expect(transition(0, "right")).toBe(1);
    expect(transition(3, "right")).toBe(3);
  });

  it("moving left decreases state, clamped at 0", () => {
    expect(transition(1, "left")).toBe(0);
    expect(transition(0, "left")).toBe(0);
  });

  it("reward is +10 only for reaching the goal, -1 otherwise", () => {
    expect(reward(3)).toBe(10);
    expect(reward(0)).toBe(-1);
    expect(reward(2)).toBe(-1);
  });

  it("only state 3 is terminal", () => {
    expect(isTerminal(3)).toBe(true);
    expect(isTerminal(0)).toBe(false);
  });
});

describe("V^pi for 'always right', by backward substitution", () => {
  it("V(3)=0, V(2)=10, V(1)=8, V(0)=6.2", () => {
    expect(valueOfAlwaysRight(3)).toBe(0);
    expect(valueOfAlwaysRight(2)).toBeCloseTo(10, 10);
    expect(valueOfAlwaysRight(1)).toBeCloseTo(8, 10);
    expect(valueOfAlwaysRight(0)).toBeCloseTo(6.2, 10);
  });

  it("matches Bellman's own recursive definition exactly: V(s) = reward + gamma*V(next)", () => {
    for (const s of [0, 1, 2]) {
      const next = transition(s, "right");
      expect(valueOfAlwaysRight(s)).toBeCloseTo(reward(next) + 0.9 * valueOfAlwaysRight(next), 10);
    }
  });
});

describe("'always left' gets stuck at the boundary forever", () => {
  it("the closed-form stuck-at-zero value is exactly -10", () => {
    expect(valueOfStuckAtZero()).toBeCloseTo(-10, 8);
  });

  it("a simulated trace from state 2 bounces at 0 and never reaches the goal", () => {
    const trace = simulate(ALWAYS_LEFT, 2, 10);
    expect(trace.every((step) => step.reward === -1)).toBe(true);
    expect(trace[trace.length - 1].nextState).toBe(0);
  });
});

describe("simulated discounted return matches the value function exactly", () => {
  it("the full 'always right' trace from state 0 nets a discounted return equal to V(0)", () => {
    const trace = simulate(ALWAYS_RIGHT, 0, 10);
    expect(trace.length).toBe(3);
    expect(discountedReturn(trace)).toBeCloseTo(valueOfAlwaysRight(0), 10);
  });
});
