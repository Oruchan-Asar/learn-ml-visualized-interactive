/**
 * RoPE rotates each dimension pair at its own frequency. A model only ever saw rotation angles up to
 * pos·rate for positions inside its trained context. Push pos past that trained length and a fast
 * (short-wavelength) dimension has already completed many full turns within the trained range — one more
 * turn past it looks like ordinary continuation. A slow (long-wavelength) dimension is different: it
 * hasn't even completed one full turn by the end of training, so extrapolating it past that point produces
 * an angle the model has simply never seen. YaRN's fix is to interpolate — shrink the *position* fed to a
 * slow dimension by the scaling factor — only for the dimensions whose wavelength exceeds the trained
 * context length, leaving the fast ones alone.
 */
export const D_MODEL = 4; // two frequency pairs, i = 0 (fast) and i = 1 (slow)
export const BASE = 10000;
export const ORIGINAL_LEN = 8; // the toy "trained" context length
export const TARGET_POS = 64; // a position deep inside an 8x-extended context (8 × ORIGINAL_LEN)
export const SCALES = [1, 2, 4, 8];

/** The angular rate of dimension-pair i — how many radians it rotates per position step. */
export function angleRate(i: number, d: number = D_MODEL): number {
  return 1 / Math.pow(BASE, (2 * i) / d);
}

/** How many position steps dimension-pair i takes to complete one full 2π rotation. */
export function wavelength(i: number, d: number = D_MODEL): number {
  return (2 * Math.PI) / angleRate(i, d);
}

/** True when a dimension's wavelength is longer than the trained context — meaning it never finished a full turn during training, so extrapolating it is unsafe. */
export function needsInterpolation(i: number, d: number = D_MODEL, originalLen: number = ORIGINAL_LEN): boolean {
  return wavelength(i, d) > originalLen;
}

/**
 * The position actually fed into dimension-pair i's rotation. Dimensions that need interpolation get
 * their position divided by the scaling factor, remapping them back toward the trained range; dimensions
 * that don't are extrapolated as-is, since they've already cycled through their full range many times.
 */
export function effectivePosition(pos: number, i: number, scale: number, d: number = D_MODEL, originalLen: number = ORIGINAL_LEN): number {
  return needsInterpolation(i, d, originalLen) ? pos / scale : pos;
}

/** The actual rotation angle dimension-pair i receives at position pos, once YaRN's interpolation is applied. */
export function yarnAngle(pos: number, i: number, scale: number, d: number = D_MODEL): number {
  return effectivePosition(pos, i, scale, d) * angleRate(i, d);
}
