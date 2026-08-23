/**
 * The exact same 6-channel activation vector as the layer/group-normalization chapter, so the two
 * chapters' numbers can be compared directly. Its mean is 0.5, not 0 -- which is exactly what
 * exposes the difference RMSNorm makes: LayerNorm forces the output back to mean 0, RMSNorm never
 * subtracts a mean in the first place, so its output mean is simply the input's mean divided by
 * its RMS.
 */
export const ACTIVATIONS: number[] = [2, -1, 0.5, 3, -2.5, 1];
export const EPS = 1e-5;
export const GAIN_DOMAIN: [number, number] = [0, 3];
export const DEFAULT_GAIN = 1;

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function meanOfSquares(xs: number[]): number {
  return xs.reduce((s, x) => s + x * x, 0) / xs.length;
}

/** Root-mean-square of a vector -- no mean-centering, just the square root of the average squared value. */
export function rms(xs: number[]): number {
  return Math.sqrt(meanOfSquares(xs) + EPS);
}

/** RMSNorm: divide by RMS(h) and multiply by a (learned, here shared-scalar) gain -- no mean subtraction. */
export function rmsNormalize(xs: number[], gain: number = DEFAULT_GAIN): number[] {
  const r = rms(xs);
  return xs.map((x) => (gain * x) / r);
}

/** LayerNorm on the exact same vector, for direct comparison -- this one *does* re-center to mean 0. */
export function layerNormalize(xs: number[]): number[] {
  const m = mean(xs);
  const std = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length + EPS);
  return xs.map((x) => (x - m) / std);
}

export const TARGET_CHANNEL_INDEX = 3; // the largest-magnitude channel (value 3)
export const TARGET_VALUE = 2.0;
export const TARGET_TOLERANCE = 0.05;
