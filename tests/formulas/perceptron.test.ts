import { describe, it, expect } from "vitest";
import {
  PERCEPTRON_POINTS,
  PERCEPTRON_X_DOMAIN,
  PERCEPTRON_Y_DOMAIN,
  LEARNING_RATE,
  perceptronStep,
  predict,
  lineEndpoints,
  type PerceptronState,
} from "@/lib/math-core/perceptron";

function runSteps(n: number): PerceptronState {
  let state: PerceptronState = { w: { x: 0, y: 0 }, b: 0 };
  for (let i = 0; i < n; i++) {
    const point = PERCEPTRON_POINTS[i % PERCEPTRON_POINTS.length];
    state = perceptronStep(state, point, LEARNING_RATE);
  }
  return state;
}

describe("perceptron learning, hand-derived step by step", () => {
  it("step 1 misclassifies (3,6,A) and updates to w=(-3,-6), b=-1", () => {
    const state = runSteps(1);
    expect(state.w).toEqual({ x: -3, y: -6 });
    expect(state.b).toBe(-1);
  });

  it("steps 2-4 are all already correctly classified — no further change", () => {
    const state = runSteps(4);
    expect(state.w).toEqual({ x: -3, y: -6 });
    expect(state.b).toBe(-1);
  });

  it("step 5 misclassifies (5,4,B) and updates to w=(2,-2), b=0", () => {
    const state = runSteps(5);
    expect(state.w).toEqual({ x: 2, y: -2 });
    expect(state.b).toBe(0);
  });

  it("every remaining point in the first pass (6-8) is already correct", () => {
    const state = runSteps(8);
    expect(state.w).toEqual({ x: 2, y: -2 });
    expect(state.b).toBe(0);
  });

  it("a full second pass (steps 9-16) makes zero further updates — convergence", () => {
    const afterFirstPass = runSteps(8);
    const afterSecondPass = runSteps(16);
    expect(afterSecondPass).toEqual(afterFirstPass);
  });
});

describe("the converged perceptron correctly classifies every point", () => {
  it("predicts A (-1) for all class-A points and B (+1) for all class-B points", () => {
    const state = runSteps(16);
    for (const p of PERCEPTRON_POINTS) {
      const expected = p.label === "B" ? 1 : -1;
      expect(predict(state.w, state.b, p)).toBe(expected);
    }
  });
});

describe("lineEndpoints", () => {
  it("is a flat placeholder at the vertical midpoint before any update (w=(0,0))", () => {
    const { yLeft, yRight } = lineEndpoints({ x: 0, y: 0 }, 0, PERCEPTRON_X_DOMAIN, PERCEPTRON_Y_DOMAIN);
    expect(yLeft).toBe(yRight);
    expect(yLeft).toBeCloseTo((PERCEPTRON_Y_DOMAIN[0] + PERCEPTRON_Y_DOMAIN[1]) / 2, 10);
  });

  it("traces exactly y=x for the converged w=(2,-2), b=0", () => {
    const { yLeft, yRight } = lineEndpoints({ x: 2, y: -2 }, 0, PERCEPTRON_X_DOMAIN, PERCEPTRON_Y_DOMAIN);
    expect(yLeft).toBeCloseTo(PERCEPTRON_X_DOMAIN[0], 10);
    expect(yRight).toBeCloseTo(PERCEPTRON_X_DOMAIN[1], 10);
  });
});
