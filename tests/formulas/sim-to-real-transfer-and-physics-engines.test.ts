import { describe, expect, it } from "vitest";
import {
  START,
  TARGET,
  SIM_FRICTION,
  REAL_FRICTION,
  SIM_GAIN,
  STEPS,
  SUCCESS_TOLERANCE,
  finalError,
  finalPosition,
  succeeds,
} from "@/lib/math-core/sim-to-real-transfer-and-physics-engines";

describe("sim-to-real-transfer-and-physics-engines", () => {
  it("in sim, the tuned gain reaches within tolerance after the fixed step budget", () => {
    expect(finalError(SIM_GAIN, SIM_FRICTION, STEPS)).toBeCloseTo(0.25, 10);
    expect(finalPosition(SIM_GAIN, SIM_FRICTION, STEPS)).toBeCloseTo(3.75, 10);
    expect(succeeds(SIM_GAIN, SIM_FRICTION)).toBe(true);
  });

  it("the same gain, under real friction, misses the tolerance — the reality gap", () => {
    expect(finalError(SIM_GAIN, REAL_FRICTION, STEPS)).toBeCloseTo(0.9604, 10);
    expect(finalPosition(SIM_GAIN, REAL_FRICTION, STEPS)).toBeCloseTo(3.0396, 10);
    expect(succeeds(SIM_GAIN, REAL_FRICTION)).toBe(false);
  });

  it("zero friction or zero gain means zero delivered motion, so error stays at the start distance", () => {
    expect(finalError(0, REAL_FRICTION, STEPS)).toBeCloseTo(TARGET - START, 10);
  });

  it("a large enough compensating gain closes the reality gap within the same step budget", () => {
    expect(succeeds(1.5, REAL_FRICTION)).toBe(true);
    expect(finalError(1.5, REAL_FRICTION, STEPS)).toBeLessThan(SUCCESS_TOLERANCE);
  });

  it("success is a strict tolerance check on the exact error formula", () => {
    const boundaryGain = 0.5;
    expect(succeeds(boundaryGain, SIM_FRICTION)).toBe(finalError(boundaryGain, SIM_FRICTION) <= SUCCESS_TOLERANCE);
  });
});
