/**
 * NeRF represents a scene as a tiny MLP: query any 3D point + viewing direction, get back a density
 * (how "solid" that point is) and a color. To turn that into a pixel, march a ray through the scene,
 * take N samples along it, and composite their densities and colors into one final color — exactly the
 * same "alpha compositing" used to blend layers in image editors, just applied front-to-back along a ray.
 *
 * A sample's opacity comes from its density sigma and the step size delta between samples:
 *
 *   alpha_i = 1 - exp(-sigma_i * delta_i)
 *
 * A sample can only contribute light that survives everything nearer to the camera. That surviving
 * fraction is the transmittance T_i — the product of every earlier sample's "see-through" factor:
 *
 *   T_i = prod_{j<i} (1 - alpha_j)
 *
 * The final pixel color is the weighted sum of every sample's color, weighted by how much of it actually
 * reaches the camera:
 *
 *   C = sum_i T_i * alpha_i * c_i
 */

export interface RaySample {
  /** Opacity contributed by this sample alone (already turned from density+step into a 0..1 alpha). */
  alpha: number;
  /** RGB color the MLP predicted at this sample, each channel in [0, 1]. */
  color: [number, number, number];
}

/** Turns a raw density and step size into an opacity in [0, 1). A denser sample, or a longer step
 * through it, blocks more light. */
export function alphaFromDensity(sigma: number, delta: number): number {
  return 1 - Math.exp(-sigma * delta);
}

/** How much light survives to reach sample i: the product of every earlier sample's transparency
 * (1 - alpha). The first sample always has full transmittance — nothing has occluded it yet. */
export function transmittances(alphas: number[]): number[] {
  const t: number[] = [];
  let running = 1;
  for (const alpha of alphas) {
    t.push(running);
    running *= 1 - alpha;
  }
  return t;
}

/** Each sample's actual contribution weight: how much of it is both opaque (alpha) and visible (T). */
export function sampleWeights(alphas: number[]): number[] {
  const t = transmittances(alphas);
  return alphas.map((alpha, i) => t[i] * alpha);
}

/** The rendering equation: composite every sample's color, weighted by its contribution. */
export function compositeColor(samples: RaySample[]): [number, number, number] {
  const weights = sampleWeights(samples.map((s) => s.alpha));
  let r = 0,
    g = 0,
    b = 0;
  samples.forEach((s, i) => {
    r += weights[i] * s.color[0];
    g += weights[i] * s.color[1];
    b += weights[i] * s.color[2];
  });
  return [r, g, b];
}

/** Total opacity the ray accumulated — 1 means it hit something fully opaque before running out of
 * samples, less than 1 means some background shows through. */
export function totalOpacity(alphas: number[]): number {
  return sampleWeights(alphas).reduce((sum, w) => sum + w, 0);
}

// A 3-sample ray: red and green are half-transparent, blue is a fully opaque surface behind them.
export const DEFAULT_SAMPLES: RaySample[] = [
  { alpha: 0.5, color: [1, 0, 0] },
  { alpha: 0.5, color: [0, 1, 0] },
  { alpha: 1, color: [0, 0, 1] },
];

// Checkpoint: drag sample 1's alpha (occlusion) with samples 2-3 held at DEFAULT_SAMPLES' values,
// until the far, fully-opaque sample 3 receives this much of the final color's weight.
export const CHECKPOINT_TARGET_WEIGHT = 0.4;
export const CHECKPOINT_TOLERANCE = 0.02;
