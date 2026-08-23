import { describe, expect, it } from "vitest";
import {
  CLEAN_TRAJECTORY,
  NOISE_TRAJECTORY,
  TOTAL_STEPS,
  lerp,
  waypointsAtStep,
  errorAtStep,
  CHECKPOINT_STEP,
  CHECKPOINT_WAYPOINT_INDEX,
} from "@/lib/math-core/diffusion-policies-for-manipulation";

describe("diffusion-policies-for-manipulation", () => {
  it("lerp at t=0 is a, at t=1 is b", () => {
    expect(lerp({ x: 0, y: 0 }, { x: 4, y: 2 }, 0)).toEqual({ x: 0, y: 0 });
    expect(lerp({ x: 0, y: 0 }, { x: 4, y: 2 }, 1)).toEqual({ x: 4, y: 2 });
  });

  it("step 0 is pure noise", () => {
    expect(waypointsAtStep(0)).toEqual(NOISE_TRAJECTORY);
  });

  it("the final step is the clean trajectory", () => {
    expect(waypointsAtStep(TOTAL_STEPS)).toEqual(CLEAN_TRAJECTORY);
  });

  it("an intermediate step lands exactly at the linear interpolation", () => {
    const waypoints = waypointsAtStep(2, 4);
    expect(waypoints[0]).toEqual({ x: -0.5, y: 1 });
    expect(waypoints[2]).toEqual({ x: 1, y: 1.5 });
  });

  it("denoising error is 0 at the final step and positive at step 0", () => {
    expect(errorAtStep(TOTAL_STEPS)).toBe(0);
    expect(errorAtStep(0)).toBeCloseTo(15.09901951359278, 10);
  });

  it("error shrinks monotonically as the step count climbs", () => {
    const errors = [0, 1, 2, 3, 4].map((s) => errorAtStep(s));
    for (let i = 1; i < errors.length; i++) {
      expect(errors[i]).toBeLessThan(errors[i - 1]);
    }
  });

  it("the checkpoint's unseen step and waypoint resolve to an exact target", () => {
    const target = waypointsAtStep(CHECKPOINT_STEP)[CHECKPOINT_WAYPOINT_INDEX];
    expect(target).toEqual({ x: 2.25, y: 0.75 });
  });
});
