import { describe, it, expect } from "vitest";
import { score, langevinStep, runTrajectory, distanceToModeAfter, MU, START_X, CHECKPOINT_STEPS, DECAY_FACTOR } from "@/lib/math-core/score-based-generative-models";

describe("score", () => {
  it("is zero exactly at the mode", () => {
    expect(score(MU)).toBe(0);
  });

  it("points toward the mode from either side", () => {
    expect(score(MU - 1)).toBeGreaterThan(0);
    expect(score(MU + 1)).toBeLessThan(0);
  });
});

describe("langevinStep", () => {
  it("matches the hand-computed first few steps starting from -5", () => {
    let x = START_X;
    const expected = [-2.6, -0.92, 0.256, 1.0792];
    for (const e of expected) {
      x = langevinStep(x);
      expect(x).toBeCloseTo(e, 10);
    }
  });
});

describe("runTrajectory", () => {
  it("matches the hand-computed trajectory exactly", () => {
    const traj = runTrajectory(START_X, 4);
    expect(traj).toHaveLength(5);
    expect(traj[0]).toBe(START_X);
    expect(traj[1]).toBeCloseTo(-2.6, 10);
    expect(traj[4]).toBeCloseTo(1.0792, 10);
  });

  it("monotonically approaches the mode from below", () => {
    const traj = runTrajectory(START_X, 10);
    for (let i = 1; i < traj.length; i++) {
      expect(traj[i]).toBeGreaterThan(traj[i - 1]);
      expect(traj[i]).toBeLessThan(MU);
    }
  });
});

describe("distanceToModeAfter (closed form)", () => {
  it("matches the simulated trajectory's distance to the mode at every checkpoint step", () => {
    for (const steps of CHECKPOINT_STEPS) {
      const traj = runTrajectory(START_X, steps);
      const simulated = Math.abs(traj[traj.length - 1] - MU);
      expect(distanceToModeAfter(START_X, steps)).toBeCloseTo(simulated, 8);
    }
  });

  it("decays by exactly DECAY_FACTOR (0.7) per step", () => {
    expect(DECAY_FACTOR).toBeCloseTo(0.7, 10);
    const d4 = distanceToModeAfter(START_X, 4);
    const d5 = distanceToModeAfter(START_X, 5);
    expect(d5 / d4).toBeCloseTo(0.7, 10);
  });

  it("the smallest checkpoint step count where the distance drops under 0.5 is 8", () => {
    const first = CHECKPOINT_STEPS.find((steps) => distanceToModeAfter(START_X, steps) < 0.5);
    expect(first).toBe(8);
  });
});
