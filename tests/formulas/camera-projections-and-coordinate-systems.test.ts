import { describe, it, expect } from "vitest";
import {
  worldToCamera,
  perspectiveDivide,
  applyIntrinsics,
  projectPoint,
  DEFAULT_INTRINSICS,
  ORIGIN_CAMERA,
  WORLD_POINTS,
  TRANSLATED_CAMERA,
  TRANSLATED_WORLD_POINT,
} from "@/lib/math-core/camera-projections-and-coordinate-systems";

describe("worldToCamera", () => {
  it("is the identity when the camera sits at the world origin", () => {
    expect(worldToCamera(WORLD_POINTS[0], ORIGIN_CAMERA)).toEqual({ x: 1, y: 1, z: 5 });
  });

  it("subtracts the camera center when the camera has moved", () => {
    expect(worldToCamera(TRANSLATED_WORLD_POINT, TRANSLATED_CAMERA)).toEqual({ x: 2, y: 1, z: 5 });
  });
});

describe("perspectiveDivide", () => {
  it("divides x and y by z", () => {
    expect(perspectiveDivide({ x: 1, y: 1, z: 5 })).toEqual({ x: 0.2, y: 0.2 });
    expect(perspectiveDivide({ x: 2, y: -1, z: 4 })).toEqual({ x: 0.5, y: -0.25 });
  });
});

describe("applyIntrinsics", () => {
  it("scales by focal length and shifts by the principal point", () => {
    expect(applyIntrinsics({ x: 0.2, y: 0.2 }, DEFAULT_INTRINSICS)).toEqual({ x: 70, y: 70 });
    expect(applyIntrinsics({ x: 0, y: 0 })).toEqual({ x: 50, y: 50 });
  });
});

describe("projectPoint — full pipeline on the three worked-example points", () => {
  it("matches the hand-computed pixel coordinates for P1, P2, P3", () => {
    expect(projectPoint(WORLD_POINTS[0], ORIGIN_CAMERA)).toEqual({ x: 70, y: 70 });
    expect(projectPoint(WORLD_POINTS[1], ORIGIN_CAMERA)).toEqual({ x: 100, y: 25 });
    expect(projectPoint(WORLD_POINTS[2], ORIGIN_CAMERA)).toEqual({ x: 50, y: 70 });
  });

  it("matches the hand-computed pixel for a translated camera (extrinsics doing real work)", () => {
    expect(projectPoint(TRANSLATED_WORLD_POINT, TRANSLATED_CAMERA)).toEqual({ x: 90, y: 70 });
  });

  it("a point directly on the camera's forward axis (X=Y=0) always lands at the principal point", () => {
    expect(projectPoint({ x: 0, y: 0, z: 7 }, ORIGIN_CAMERA)).toEqual({ x: 50, y: 50 });
  });

  it("doubling both X and Y at fixed Z scales the offset from the principal point, not the principal point itself", () => {
    const near = projectPoint({ x: 1, y: 1, z: 5 }, ORIGIN_CAMERA);
    const far = projectPoint({ x: 2, y: 2, z: 5 }, ORIGIN_CAMERA);
    expect(far.x - 50).toBeCloseTo(2 * (near.x - 50), 10);
    expect(far.y - 50).toBeCloseTo(2 * (near.y - 50), 10);
  });
});
