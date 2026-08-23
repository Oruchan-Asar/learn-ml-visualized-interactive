/**
 * Turning a 3D Gaussian into a pixel takes two more ingredients on top of chapter 4's alpha compositing:
 *
 *   1. Projection: a Gaussian's 3D spread (sigma, in world units) shrinks on screen the farther away it
 *      is — the same perspective shrink as a camera projecting a point, applied to a *blob's size*
 *      instead of a point's position. Approximating the camera as looking straight at each Gaussian,
 *      the projected screen-space spread is just world spread scaled by focal length over depth:
 *
 *      sigma_2D = sigma_world * f / depth
 *
 *   2. Depth order: Gaussians must be composited nearest-first, exactly like NeRF samples along a ray.
 *      Composite them in the wrong order and a background Gaussian wrongly "wins" the pixel.
 *
 * Once rendered, 3DGS never touches the neural-network machinery of NeRF — it optimizes each Gaussian's
 * own parameters (opacity, position, color, covariance) directly by gradient descent against a rendering
 * loss, the same way any other parameter gets trained.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const WHITE_BG: RGB = { r: 1, g: 1, b: 1 };

/** Perspective shrink of a Gaussian's world-space spread, projected to screen space. */
export function projectedSigma(sigmaWorld: number, focalLength: number, depth: number): number {
  return (sigmaWorld * focalLength) / depth;
}

export interface ProjectedGaussian {
  x: number;
  y: number;
  sigma2D: number;
  opacity: number;
  color: RGB;
  depth: number;
}

export function gaussianWeight(px: number, py: number, g: ProjectedGaussian): number {
  const dx = px - g.x;
  const dy = py - g.y;
  return Math.exp(-0.5 * ((dx * dx + dy * dy) / (g.sigma2D * g.sigma2D)));
}

export function alphaAt(px: number, py: number, g: ProjectedGaussian): number {
  return g.opacity * gaussianWeight(px, py, g);
}

/** Nearest-first: the order the differentiable rasterizer must composite in. */
export function sortByDepth(gaussians: ProjectedGaussian[]): ProjectedGaussian[] {
  return [...gaussians].sort((a, b) => a.depth - b.depth);
}

export interface RasterResult {
  color: RGB;
  contributions: number[];
}

/** Alpha-composite already depth-sorted Gaussians at one pixel. */
export function rasterizePixel(px: number, py: number, sorted: ProjectedGaussian[]): RasterResult {
  let transmittance = 1;
  let r = 0,
    g = 0,
    b = 0;
  const contributions: number[] = [];
  for (const gauss of sorted) {
    const a = alphaAt(px, py, gauss);
    const w = transmittance * a;
    contributions.push(w);
    r += w * gauss.color.r;
    g += w * gauss.color.g;
    b += w * gauss.color.b;
    transmittance *= 1 - a;
  }
  return { color: { r, g, b }, contributions };
}

// Two Gaussians directly on top of each other (both centered at the same screen point, radius large
// enough that weight = 1 there) at different depths — isolates *why* depth order matters.
export const NEAR_GAUSSIAN: ProjectedGaussian = { x: 0, y: 0, sigma2D: 5, opacity: 0.5, color: { r: 1, g: 0, b: 0 }, depth: 5 };
export const FAR_GAUSSIAN: ProjectedGaussian = { x: 0, y: 0, sigma2D: 5, opacity: 0.9, color: { r: 0, g: 0, b: 1 }, depth: 10 };

// --- Optimization: one gradient-descent step on a single Gaussian's opacity ---
//
// Simplify to a Gaussian sitting exactly at the query pixel (weight = 1), rendered over a white
// background, so the rendered color is just a straight blend:
//
//   rendered = opacity * color + (1 - opacity) * background

export function blendOverBackground(opacity: number, color: RGB, background: RGB = WHITE_BG): RGB {
  return {
    r: opacity * color.r + (1 - opacity) * background.r,
    g: opacity * color.g + (1 - opacity) * background.g,
    b: opacity * color.b + (1 - opacity) * background.b,
  };
}

export function squaredErrorLoss(rendered: RGB, target: RGB): number {
  return (rendered.r - target.r) ** 2 + (rendered.g - target.g) ** 2 + (rendered.b - target.b) ** 2;
}

/** dL/d(opacity) for a single Gaussian blended straight over the background. */
export function opacityGradient(opacity: number, color: RGB, target: RGB, background: RGB = WHITE_BG): number {
  const rendered = blendOverBackground(opacity, color, background);
  const dR = 2 * (rendered.r - target.r) * (color.r - background.r);
  const dG = 2 * (rendered.g - target.g) * (color.g - background.g);
  const dB = 2 * (rendered.b - target.b) * (color.b - background.b);
  return dR + dG + dB;
}

export function gradientDescentStep(opacity: number, grad: number, learningRate: number): number {
  return Math.min(1, Math.max(0, opacity - learningRate * grad));
}

export const TRAIN_COLOR: RGB = { r: 1, g: 0, b: 0 };
export const TRAIN_TARGET: RGB = { r: 1, g: 0.2, b: 0.2 };
export const TRAIN_INITIAL_OPACITY = 0.5;

// Checkpoint: drag the learning rate until one gradient step from TRAIN_INITIAL_OPACITY lands here.
export const CHECKPOINT_TARGET_OPACITY = 0.8;
export const CHECKPOINT_TOLERANCE = 0.02;
