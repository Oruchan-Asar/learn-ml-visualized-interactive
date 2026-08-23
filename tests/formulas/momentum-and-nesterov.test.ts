import { describe, it, expect } from "vitest";
import { f, gradient, momentumStep, nesterovStep, lookaheadPoint } from "@/lib/math-core/momentum-and-nesterov";

const LEARNING_RATE = 0.045;
const BETA = 0.7;
const START = { x: 4, y: 1 };
const ZERO_STATE = { point: START, velocity: { x: 0, y: 0 } };

describe("f(x,y) = x^2 + 10y^2", () => {
  it("is zero at the origin and the gradient vanishes there", () => {
    expect(f(0, 0)).toBeCloseTo(0);
    const g = gradient(0, 0);
    expect(g.x).toBeCloseTo(0);
    expect(g.y).toBeCloseTo(0);
  });
});

describe("momentum and Nesterov agree on step 1 — velocity starts at zero either way", () => {
  it("both land at (3.64, 0.1)", () => {
    const m1 = momentumStep(ZERO_STATE, gradient, LEARNING_RATE, BETA);
    const n1 = nesterovStep(ZERO_STATE, gradient, LEARNING_RATE, BETA);
    expect(m1.point.x).toBeCloseTo(3.64, 10);
    expect(m1.point.y).toBeCloseTo(0.1, 10);
    expect(n1.point.x).toBeCloseTo(3.64, 10);
    expect(n1.point.y).toBeCloseTo(0.1, 10);
  });
});

describe("Nesterov's look-ahead point, hand-computed before step 2", () => {
  it("look-ahead = point - η·β·velocity = (3.388, -0.53)", () => {
    const step1 = momentumStep(ZERO_STATE, gradient, LEARNING_RATE, BETA);
    const look = lookaheadPoint(step1, LEARNING_RATE, BETA);
    expect(look.x).toBeCloseTo(3.388, 10);
    expect(look.y).toBeCloseTo(-0.53, 10);
  });
});

describe("momentum and Nesterov diverge on step 2, hand-computed", () => {
  it("momentum step 2 lands at (3.0604, -0.62)", () => {
    const step1 = momentumStep(ZERO_STATE, gradient, LEARNING_RATE, BETA);
    const step2 = momentumStep(step1, gradient, LEARNING_RATE, BETA);
    expect(step2.point.x).toBeCloseTo(3.0604, 8);
    expect(step2.point.y).toBeCloseTo(-0.62, 8);
  });

  it("Nesterov step 2 uses the look-ahead gradient (6.776, -10.6) and lands at (3.08308, -0.053)", () => {
    const step1 = nesterovStep(ZERO_STATE, gradient, LEARNING_RATE, BETA);
    const look = lookaheadPoint(step1, LEARNING_RATE, BETA);
    const g = gradient(look.x, look.y);
    expect(g.x).toBeCloseTo(6.776, 10);
    expect(g.y).toBeCloseTo(-10.6, 10);

    const step2 = nesterovStep(step1, gradient, LEARNING_RATE, BETA);
    expect(step2.point.x).toBeCloseTo(3.08308, 8);
    expect(step2.point.y).toBeCloseTo(-0.053, 8);
  });

  it("the two methods produce genuinely different trajectories by step 2", () => {
    const m1 = momentumStep(ZERO_STATE, gradient, LEARNING_RATE, BETA);
    const m2 = momentumStep(m1, gradient, LEARNING_RATE, BETA);
    const n1 = nesterovStep(ZERO_STATE, gradient, LEARNING_RATE, BETA);
    const n2 = nesterovStep(n1, gradient, LEARNING_RATE, BETA);
    expect(m2.point.x).not.toBeCloseTo(n2.point.x, 4);
  });
});

describe("β=0 collapses both methods to plain gradient descent, and to each other", () => {
  it("momentum and Nesterov match exactly when β=0", () => {
    let mState = ZERO_STATE;
    let nState = ZERO_STATE;
    for (let i = 0; i < 6; i++) {
      mState = momentumStep(mState, gradient, LEARNING_RATE, 0);
      nState = nesterovStep(nState, gradient, LEARNING_RATE, 0);
      expect(mState.point.x).toBeCloseTo(nState.point.x, 10);
      expect(mState.point.y).toBeCloseTo(nState.point.y, 10);
    }
  });
});
