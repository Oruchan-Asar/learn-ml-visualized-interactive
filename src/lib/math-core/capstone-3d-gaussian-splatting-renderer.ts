/**
 * The capstone: render one pixel of a 3D Gaussian Splatting scene, end to end, gluing together every
 * piece from this Part.
 *
 *   1. Camera projection (ch. 2): the same pinhole camera — world-to-camera, then perspective divide,
 *      then intrinsics — turns each Gaussian's 3D mean into a screen-space pixel.
 *   2. Gaussian fundamentals (ch. 4): each Gaussian's opacity falls off from its projected center with a
 *      screen-space spread; a query pixel's alpha is opacity x that falloff.
 *   3. Rasterization (ch. 5): a Gaussian's world-space spread projects to a *screen-space* spread that
 *      shrinks with depth (sigma_2D = sigma_world * f / depth), and Gaussians composite nearest-first.
 *
 * Put together: project every Gaussian in the scene, sort by depth, then alpha-composite them at the
 * query pixel over a background — the same rendering equation as a NeRF ray march, just with Gaussians
 * standing in for ray samples.
 */

import {
  worldToCamera,
  perspectiveDivide,
  applyIntrinsics,
  ORIGIN_CAMERA,
  DEFAULT_INTRINSICS,
  type Vec3,
  type Intrinsics,
} from "@/lib/math-core/camera-projections-and-coordinate-systems";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const WHITE_BG: RGB = { r: 1, g: 1, b: 1 };

export interface SceneGaussian {
  mu: Vec3; // world-space center
  sigmaWorld: number; // isotropic world-space spread
  opacity: number;
  color: RGB;
}

export interface ProjectedGaussian {
  x: number;
  y: number;
  sigma2D: number;
  opacity: number;
  color: RGB;
  depth: number;
}

/** Steps 1 + 3: project a world-space Gaussian's center and spread into screen space. */
export function projectGaussian(
  g: SceneGaussian,
  cameraCenter: Vec3 = ORIGIN_CAMERA,
  k: Intrinsics = DEFAULT_INTRINSICS,
): ProjectedGaussian {
  const cam = worldToCamera(g.mu, cameraCenter);
  const ndc = perspectiveDivide(cam);
  const pixel = applyIntrinsics(ndc, k);
  const sigma2D = (k.f * g.sigmaWorld) / cam.z;
  return { x: pixel.x, y: pixel.y, sigma2D, opacity: g.opacity, color: g.color, depth: cam.z };
}

/** Step 2: falloff-weighted opacity at a query pixel. */
export function gaussianWeight(px: number, py: number, g: ProjectedGaussian): number {
  const dx = px - g.x;
  const dy = py - g.y;
  return Math.exp(-0.5 * ((dx * dx + dy * dy) / (g.sigma2D * g.sigma2D)));
}

export function alphaAt(px: number, py: number, g: ProjectedGaussian): number {
  return g.opacity * gaussianWeight(px, py, g);
}

export function sortByDepth(gaussians: ProjectedGaussian[]): ProjectedGaussian[] {
  return [...gaussians].sort((a, b) => a.depth - b.depth);
}

export interface RenderResult {
  color: RGB;
  contributions: number[];
  transmittance: number;
  projected: ProjectedGaussian[];
}

/** The full pipeline: project every Gaussian, depth-sort, alpha-composite at (px, py) over background. */
export function renderPixel(
  px: number,
  py: number,
  scene: SceneGaussian[],
  cameraCenter: Vec3 = ORIGIN_CAMERA,
  k: Intrinsics = DEFAULT_INTRINSICS,
  background: RGB = WHITE_BG,
): RenderResult {
  const projected = sortByDepth(scene.map((g) => projectGaussian(g, cameraCenter, k)));

  let transmittance = 1;
  let r = 0,
    g = 0,
    b = 0;
  const contributions: number[] = [];
  for (const gauss of projected) {
    const a = alphaAt(px, py, gauss);
    const w = transmittance * a;
    contributions.push(w);
    r += w * gauss.color.r;
    g += w * gauss.color.g;
    b += w * gauss.color.b;
    transmittance *= 1 - a;
  }
  r += transmittance * background.r;
  g += transmittance * background.g;
  b += transmittance * background.b;

  return { color: { r, g, b }, contributions, transmittance, projected };
}

// A tiny 2-Gaussian scene: a small, near, red Gaussian on the camera's forward axis, and a bigger,
// farther, blue Gaussian slightly off-axis — viewed through the same camera as ch. 2's worked examples.
export const GAUSSIAN_NEAR: SceneGaussian = {
  mu: { x: 0, y: 0, z: 5 },
  sigmaWorld: 0.1,
  opacity: 0.6,
  color: { r: 1, g: 0, b: 0 },
};

export const GAUSSIAN_FAR: SceneGaussian = {
  mu: { x: 0.3, y: 0, z: 10 },
  sigmaWorld: 0.3,
  opacity: 0.9,
  color: { r: 0, g: 0, b: 1 },
};

export const SCENE: SceneGaussian[] = [GAUSSIAN_NEAR, GAUSSIAN_FAR];
export const QUERY_PIXEL = { x: 50, y: 50 }; // the principal point — exactly where GAUSSIAN_NEAR projects to

// Checkpoint: drag the query pixel's x-coordinate (between the two Gaussians' projected centers, 50 and
// 53) until the rendered red channel reaches this.
export const CHECKPOINT_TARGET_RED = 0.5;
export const CHECKPOINT_TOLERANCE = 0.03;
