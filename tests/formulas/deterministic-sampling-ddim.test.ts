import { describe, expect, it } from "vitest";
import {
  X0,
  EPS,
  T,
  ALPHA_BAR,
  X_T,
  xAt,
  predictX0,
  ddimStep,
  reverseStep,
  runSchedule,
  finalValue,
  SCHEDULE_FULL,
  SCHEDULE_SKIP,
  SCHEDULE_SINGLE,
  FIXED_Z,
  TARGET_ERROR,
} from "@/lib/math-core/deterministic-sampling-ddim";

describe("forward marginal", () => {
  it("x_T matches the hand-derived value", () => {
    expect(X_T).toBeCloseTo(3.1304951684997055, 10);
  });

  it("xAt(0) recovers x0 exactly (no noise at t=0)", () => {
    expect(xAt(0)).toBe(X0);
  });
});

describe("a perfect predictor's x0 estimate is exact at every timestep", () => {
  it("predictX0 recovers x0 exactly from x_T", () => {
    expect(predictX0(X_T, T, EPS)).toBeCloseTo(X0, 10);
  });

  it("predictX0 recovers x0 exactly from any intermediate x_t", () => {
    for (let t = 1; t <= T; t++) {
      expect(predictX0(xAt(t), t, EPS)).toBeCloseTo(X0, 10);
    }
  });
});

describe("DDIM's deterministic schedule (eta = 0)", () => {
  it("the full 4-step schedule ends exactly at x0", () => {
    const trace = runSchedule(SCHEDULE_FULL, 0);
    expect(finalValue(trace)).toBeCloseTo(X0, 8);
  });

  it("skipping steps (4->2->0) lands on the exact same destination", () => {
    const trace = runSchedule(SCHEDULE_SKIP, 0);
    expect(finalValue(trace)).toBeCloseTo(X0, 8);
  });

  it("a single jump (4->0) still lands on the exact same destination", () => {
    const trace = runSchedule(SCHEDULE_SINGLE, 0);
    expect(finalValue(trace)).toBeCloseTo(X0, 8);
  });

  it("path independence: the skip schedule's intermediate x_2 matches the full schedule's x_2 exactly", () => {
    const full = runSchedule(SCHEDULE_FULL, 0);
    const skip = runSchedule(SCHEDULE_SKIP, 0);
    const fullAtT2 = full.find((e) => e.t === 2)!;
    const skipAtT2 = skip.find((e) => e.t === 2)!;
    expect(skipAtT2.value).toBe(fullAtT2.value);
  });

  it("matches the chapter's hand-derived intermediate trace", () => {
    const trace = runSchedule(SCHEDULE_FULL, 0);
    const values = trace.map((e) => e.value);
    expect(values[0]).toBeCloseTo(3.1304951684997055, 8);
    expect(values[1]).toBeCloseTo(3.936874329409863, 8);
    expect(values[2]).toBeCloseTo(4.505438878241093, 8);
    expect(values[3]).toBeCloseTo(4.919349550499538, 8);
    expect(values[4]).toBeCloseTo(5, 8);
  });
});

describe("determinism itself: identical inputs always produce identical output", () => {
  it("re-running the same deterministic schedule from the same starting point gives bit-identical results", () => {
    const a = runSchedule(SCHEDULE_FULL, 0);
    const b = runSchedule(SCHEDULE_FULL, 0);
    expect(a.map((e) => e.value)).toEqual(b.map((e) => e.value));
  });

  it("re-running the same stochastic (eta=1) schedule with the same fixed z's is also bit-identical", () => {
    const a = runSchedule(SCHEDULE_FULL, 1, FIXED_Z);
    const b = runSchedule(SCHEDULE_FULL, 1, FIXED_Z);
    expect(finalValue(a)).toBe(finalValue(b));
  });

  it("ddimStep is a pure function of its arguments -- same call, same result, every time", () => {
    expect(ddimStep(X_T, 4, 0)).toBe(ddimStep(X_T, 4, 0));
  });
});

describe("injected randomness (eta > 0) breaks path independence and drifts away from x0", () => {
  it("eta=1 with fixed noise draws does NOT reconstruct x0 exactly", () => {
    const trace = runSchedule(SCHEDULE_FULL, 1, FIXED_Z);
    const error = Math.abs(finalValue(trace) - X0);
    expect(error).toBeGreaterThan(TARGET_ERROR);
    expect(finalValue(trace)).toBeCloseTo(2.912882692912616, 8);
  });

  it("reconstruction error scales linearly in eta, for fixed z's", () => {
    const errorAt = (eta: number) => Math.abs(finalValue(runSchedule(SCHEDULE_FULL, eta, FIXED_Z)) - X0);
    const full = errorAt(1);
    expect(errorAt(0.5)).toBeCloseTo(full / 2, 8);
    expect(errorAt(0.25)).toBeCloseTo(full / 4, 8);
    expect(errorAt(0)).toBeCloseTo(0, 8);
  });

  it("the last transition's noise draw never matters -- ALPHA_BAR[0] = 1 zeroes its coefficient", () => {
    const traceA = runSchedule(SCHEDULE_FULL, 1, [0.5, -0.5, 0.5, 999]);
    const traceB = runSchedule(SCHEDULE_FULL, 1, [0.5, -0.5, 0.5, -999]);
    expect(finalValue(traceA)).toBe(finalValue(traceB));
  });
});

describe("reverseStep matches ddimStep at eta=0", () => {
  it("agrees for every step of the full schedule", () => {
    for (let t = 4; t >= 1; t--) {
      const xt = xAt(t);
      expect(ddimStep(xt, t, t - 1)).toBeCloseTo(reverseStep(xt, t, t - 1, EPS, 0, 0), 10);
    }
  });
});

it("the schedule constants describe the setup this chapter builds on", () => {
  expect(ALPHA_BAR[0]).toBe(1);
  expect(ALPHA_BAR.length).toBe(T + 1);
  expect(SCHEDULE_SKIP.length).toBeLessThan(SCHEDULE_FULL.length);
  expect(SCHEDULE_SINGLE.length).toBe(2);
});
