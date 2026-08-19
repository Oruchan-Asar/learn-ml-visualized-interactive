import { describe, it, expect } from "vitest";
import { f, gradient, momentumStep } from "@/lib/math-core/momentum";
import { gradientDescentStep2D } from "@/lib/math-core/descent";

const LEARNING_RATE = 0.045;
const BETA = 0.7;
const START = { x: 4, y: 1 };

describe("f(x,y) = x^2 + 10y^2", () => {
  it("is zero at the origin and the gradient vanishes there", () => {
    expect(f(0, 0)).toBeCloseTo(0);
    const g = gradient(0, 0);
    expect(g.x).toBeCloseTo(0);
    expect(g.y).toBeCloseTo(0);
  });

  it("is far steeper in y than in x for the same offset — the whole point of the shape", () => {
    expect(gradient(1, 0).x).toBeCloseTo(2);
    expect(gradient(0, 1).y).toBeCloseTo(20);
  });
});

describe("momentumStep with β=0 reduces exactly to plain gradient descent", () => {
  it("matches gradientDescentStep2D step for step when β=0", () => {
    let momentumState = { point: START, velocity: { x: 0, y: 0 } };
    let plainPoint = START;
    for (let i = 0; i < 5; i++) {
      momentumState = momentumStep(momentumState, gradient, LEARNING_RATE, 0);
      plainPoint = gradientDescentStep2D(plainPoint, gradient, LEARNING_RATE);
      expect(momentumState.point.x).toBeCloseTo(plainPoint.x, 10);
      expect(momentumState.point.y).toBeCloseTo(plainPoint.y, 10);
    }
  });
});

describe("momentumStep, hand-computed for the first two steps", () => {
  it("step 1 matches plain descent exactly (velocity starts at zero either way)", () => {
    const state = momentumStep({ point: START, velocity: { x: 0, y: 0 } }, gradient, LEARNING_RATE, BETA);
    expect(state.point.x).toBeCloseTo(3.64, 5);
    expect(state.point.y).toBeCloseTo(0.1, 5);
    expect(state.velocity.x).toBeCloseTo(8, 5);
    expect(state.velocity.y).toBeCloseTo(20, 5);
  });

  it("step 2 pulls ahead of plain descent — accumulated velocity adds to the fresh gradient", () => {
    const step1 = momentumStep({ point: START, velocity: { x: 0, y: 0 } }, gradient, LEARNING_RATE, BETA);
    const step2 = momentumStep(step1, gradient, LEARNING_RATE, BETA);
    expect(step2.point.x).toBeCloseTo(3.0604, 4);
    expect(step2.point.y).toBeCloseTo(-0.62, 4);

    // Momentum's x already outpaces plain descent's x, which is still crawling
    // (small gradient, no memory to build on).
    const plainStep2 = gradientDescentStep2D(step1.point, gradient, LEARNING_RATE);
    expect(step2.point.x).toBeLessThan(plainStep2.x);
  });
});

describe("momentum makes faster net progress than plain descent on this ravine", () => {
  it("is closer to the origin than plain descent after a handful of steps", () => {
    let momentumState = { point: START, velocity: { x: 0, y: 0 } };
    let plainPoint = START;
    for (let i = 0; i < 8; i++) {
      momentumState = momentumStep(momentumState, gradient, LEARNING_RATE, BETA);
      plainPoint = gradientDescentStep2D(plainPoint, gradient, LEARNING_RATE);
    }
    const momentumDistance = Math.hypot(momentumState.point.x, momentumState.point.y);
    const plainDistance = Math.hypot(plainPoint.x, plainPoint.y);
    expect(momentumDistance).toBeLessThan(plainDistance);
  });
});
