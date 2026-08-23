/**
 * Instead of a neural network, 3D Gaussian Splatting represents a scene as a pile of soft, colored
 * ellipsoids ("Gaussians"), each with a center, a covariance (size/shape), an opacity, and a color. To
 * render a pixel, every Gaussian near it contributes a falloff-weighted bit of color, and those
 * contributions are alpha-composited front-to-back — the same compositing rule NeRF uses for ray
 * samples, just with "distance from a Gaussian's center" standing in for "distance along a ray".
 *
 * A Gaussian's opacity at a query point falls off with (squared, axis-aligned) distance from its center,
 * scaled by its per-axis spread (sigma):
 *
 *   weight(p) = exp( -0.5 * ((dx/sigma_x)^2 + (dy/sigma_y)^2) )
 *   alpha(p)  = opacity * weight(p)
 *
 * Composited front-to-back, exactly like a NeRF ray: each Gaussian only gets to paint whatever fraction
 * of the pixel earlier (nearer) Gaussians left transparent.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Gaussian2D {
  mu: { x: number; y: number };
  sigma: { x: number; y: number };
  opacity: number;
  color: RGB;
}

/** Unnormalized Gaussian falloff — 1 at the center, decaying with (scaled) squared distance. */
export function gaussianWeight(px: number, py: number, g: Gaussian2D): number {
  const dx = (px - g.mu.x) / g.sigma.x;
  const dy = (py - g.mu.y) / g.sigma.y;
  return Math.exp(-0.5 * (dx * dx + dy * dy));
}

/** How opaque this one Gaussian is at this one point — its opacity, scaled by how far the point is
 * from its center. */
export function alphaAt(px: number, py: number, g: Gaussian2D): number {
  return g.opacity * gaussianWeight(px, py, g);
}

export interface CompositeResult {
  color: RGB;
  /** Each Gaussian's actual contribution weight (opacity x visibility), in the same order given. */
  contributions: number[];
  /** Total opacity accumulated — 1 - this is how much background shows through. */
  alpha: number;
}

/** Alpha-composite a list of Gaussians at one pixel, front-to-back (list order = depth order, nearest first). */
export function compositePixel(px: number, py: number, gaussians: Gaussian2D[]): CompositeResult {
  let transmittance = 1;
  let r = 0,
    g = 0,
    b = 0;
  const contributions: number[] = [];
  for (const gauss of gaussians) {
    const a = alphaAt(px, py, gauss);
    const w = transmittance * a;
    contributions.push(w);
    r += w * gauss.color.r;
    g += w * gauss.color.g;
    b += w * gauss.color.b;
    transmittance *= 1 - a;
  }
  return { color: { r, g, b }, contributions, alpha: 1 - transmittance };
}

// Two overlapping Gaussians: a red one nearer the camera, a blue one behind it, both with the same
// spread. Query pixel sits exactly halfway between their centers.
export const GAUSSIAN_A: Gaussian2D = {
  mu: { x: 0, y: 0 },
  sigma: { x: 2, y: 2 },
  opacity: 0.6,
  color: { r: 1, g: 0, b: 0 },
};

export const GAUSSIAN_B: Gaussian2D = {
  mu: { x: 2, y: 0 },
  sigma: { x: 2, y: 2 },
  opacity: 0.8,
  color: { r: 0, g: 0, b: 1 },
};

export const SCENE: Gaussian2D[] = [GAUSSIAN_A, GAUSSIAN_B];
export const QUERY_PIXEL = { x: 1, y: 0 };

// Checkpoint: drag Gaussian B's opacity until the composited pixel's total alpha (coverage) hits this,
// with A and both centers held fixed at the worked-example values above.
export const CHECKPOINT_TARGET_ALPHA = 0.85;
export const CHECKPOINT_TOLERANCE = 0.02;
