/**
 * A pinhole camera turns a 3D world point into a 2D pixel through two stages:
 *
 *   1. Extrinsics — move the point from world coordinates into the camera's own coordinate frame
 *      (here: a camera that looks straight down +Z with no rotation, so extrinsics reduce to a
 *      translation by the camera center C).
 *   2. Intrinsics — perspective-divide by depth (Z), then scale/shift by focal length and principal
 *      point to land on actual pixel coordinates (u, v).
 *
 * Keeping rotation at the identity keeps every step exact and hand-checkable, while still showing the
 * two-matrix structure (extrinsic, then intrinsic) that a real camera pipeline uses.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Intrinsics {
  f: number; // focal length, shared by both axes here (fx = fy = f)
  cx: number; // principal point, x
  cy: number; // principal point, y
}

export const DEFAULT_INTRINSICS: Intrinsics = { f: 100, cx: 50, cy: 50 };

/** The camera looks down +Z with no rotation, so the extrinsic step is just "subtract the camera center". */
export function worldToCamera(p: Vec3, cameraCenter: Vec3): Vec3 {
  return { x: p.x - cameraCenter.x, y: p.y - cameraCenter.y, z: p.z - cameraCenter.z };
}

/** Perspective divide: project onto the z=1 plane. Undefined in front of the camera only when z <= 0. */
export function perspectiveDivide(p: Vec3): Vec2 {
  return { x: p.x / p.z, y: p.y / p.z };
}

/** Intrinsics: scale by focal length, then shift by the principal point, landing on pixel coordinates. */
export function applyIntrinsics(ndc: Vec2, k: Intrinsics = DEFAULT_INTRINSICS): Vec2 {
  return { x: k.f * ndc.x + k.cx, y: k.f * ndc.y + k.cy };
}

/** The full pipeline: world point -> camera point -> normalized image coords -> pixel (u, v). */
export function projectPoint(worldPoint: Vec3, cameraCenter: Vec3, k: Intrinsics = DEFAULT_INTRINSICS): Vec2 {
  const cam = worldToCamera(worldPoint, cameraCenter);
  const ndc = perspectiveDivide(cam);
  return applyIntrinsics(ndc, k);
}

// A small worked scene: camera at the world origin, looking down +Z, three world points in front of it.
export const ORIGIN_CAMERA: Vec3 = { x: 0, y: 0, z: 0 };
export const WORLD_POINTS: Vec3[] = [
  { x: 1, y: 1, z: 5 },
  { x: 2, y: -1, z: 4 },
  { x: 0, y: 2, z: 10 },
];

// A second scene demonstrating the extrinsic step doing real work: the camera has moved off the origin.
export const TRANSLATED_CAMERA: Vec3 = { x: 1, y: 0, z: 0 };
export const TRANSLATED_WORLD_POINT: Vec3 = { x: 3, y: 1, z: 5 };

export const CHECKPOINT_TARGET_V = 90;
export const CHECKPOINT_TOLERANCE_V = 4;
