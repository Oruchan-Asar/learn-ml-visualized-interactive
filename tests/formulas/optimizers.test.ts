import { describe, it, expect } from "vitest";
import {
  momentumStep,
  rmspropStep,
  adamStep,
  INITIAL_MOMENTUM_STATE,
  INITIAL_RMSPROP_STATE,
  INITIAL_ADAM_STATE,
  distance,
  TARGET_DISTANCE,
  TARGET_STEPS,
} from "@/lib/math-core/optimizers";

function runSteps<T>(initial: T, step: (s: T) => T, n: number): T {
  let state = initial;
  for (let i = 0; i < n; i++) state = step(state);
  return state;
}

describe("each optimizer's first step matches hand computation", () => {
  it("momentum: from (4,1), grad=(8,20), velocity=(8,20), point=(3.6,0)", () => {
    const s = momentumStep(INITIAL_MOMENTUM_STATE);
    expect(s.point.x).toBeCloseTo(3.6, 10);
    expect(s.point.y).toBeCloseTo(0, 10);
  });

  it("rmsprop: first step moves each axis by exactly lr (since sq starts at 0, normalized gradient has unit magnitude per axis)", () => {
    const s = rmspropStep(INITIAL_RMSPROP_STATE);
    // update = lr*g/(sqrt((1-beta)*g^2)+eps) ≈ lr/sqrt(1-beta) * sign(g), independent of g's magnitude
    const expectedStep = 0.3 / Math.sqrt(1 - 0.9);
    expect(4 - s.point.x).toBeCloseTo(expectedStep, 4);
    expect(1 - s.point.y).toBeCloseTo(expectedStep, 4);
  });

  it("adam: first step also moves a predictable, bias-corrected amount", () => {
    const s = adamStep(INITIAL_ADAM_STATE);
    expect(s.t).toBe(1);
    // With bias correction at t=1, mHat=g, vHat=g^2, so update = lr*g/(|g|+eps) = lr*sign(g)
    expect(4 - s.point.x).toBeCloseTo(0.3, 4);
    expect(1 - s.point.y).toBeCloseTo(0.3, 4);
  });
});

describe("all three optimizers converge within the target distance by the target step count", () => {
  it("momentum reaches within 0.2 of the origin by step 15", () => {
    const s = runSteps(INITIAL_MOMENTUM_STATE, momentumStep, TARGET_STEPS);
    expect(distance(s.point)).toBeLessThan(TARGET_DISTANCE);
  });

  it("rmsprop reaches within 0.2 of the origin by step 15", () => {
    const s = runSteps(INITIAL_RMSPROP_STATE, rmspropStep, TARGET_STEPS);
    expect(distance(s.point)).toBeLessThan(TARGET_DISTANCE);
  });

  it("adam reaches within 0.2 of the origin by step 15", () => {
    const s = runSteps(INITIAL_ADAM_STATE, adamStep, TARGET_STEPS);
    expect(distance(s.point)).toBeLessThan(TARGET_DISTANCE);
  });

  it("not all three are there yet at step 14 — step 15 is genuinely the binding constraint", () => {
    const m = runSteps(INITIAL_MOMENTUM_STATE, momentumStep, TARGET_STEPS - 1);
    const r = runSteps(INITIAL_RMSPROP_STATE, rmspropStep, TARGET_STEPS - 1);
    const a = runSteps(INITIAL_ADAM_STATE, adamStep, TARGET_STEPS - 1);
    const allWithinAtStep14 =
      distance(m.point) < TARGET_DISTANCE && distance(r.point) < TARGET_DISTANCE && distance(a.point) < TARGET_DISTANCE;
    expect(allWithinAtStep14).toBe(false);
  });
});

describe("the three paths genuinely diverge — momentum oscillates in y, rmsprop nearly doesn't", () => {
  it("momentum's y-coordinate changes sign at least 3 times across 15 steps (a zigzag)", () => {
    let state = INITIAL_MOMENTUM_STATE;
    let signChanges = 0;
    let lastSign = Math.sign(state.point.y);
    for (let i = 0; i < 15; i++) {
      state = momentumStep(state);
      const sign = Math.sign(state.point.y);
      if (sign !== 0 && sign !== lastSign) {
        signChanges++;
        lastSign = sign;
      }
    }
    expect(signChanges).toBeGreaterThanOrEqual(3);
  });

  it("rmsprop's y-coordinate stays within 0.06 of zero for the entire run — it damps the steep direction almost immediately", () => {
    let state = INITIAL_RMSPROP_STATE;
    for (let i = 0; i < 15; i++) {
      state = rmspropStep(state);
      expect(Math.abs(state.point.y)).toBeLessThan(0.06);
    }
  });
});
