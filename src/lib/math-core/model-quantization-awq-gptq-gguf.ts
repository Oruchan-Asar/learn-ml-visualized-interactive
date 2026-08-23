/**
 * Post-training quantization (the family AWQ, GPTQ, and GGUF all belong to) stores each weight as a
 * small integer level plus one shared scale, instead of a full 32-bit float. Dequantizing multiplies the
 * level back by the scale, which only exactly reconstructs weights that happen to be a multiple of the
 * scale — everything else rounds to the nearest representable level and picks up reconstruction error.
 * This toy vector is chosen so most weights round perfectly and exactly two don't, making the error
 * source visible and hand-checkable rather than lost in noise.
 */

/** Eight FP32 weights (a tiny slice of one row of a real weight matrix). */
export const WEIGHTS = [-1.6, -0.8, 0.5, 1.3, 2.0, -2.8, 0.8, -0.4];

/** Signed 4-bit levels: 16 values, -8 to 7. */
export const INT4_MIN = -8;
export const INT4_MAX = 7;

/** Scale chosen so the largest-magnitude weight maps exactly to the extreme level. */
export function computeScale(weights: number[]): number {
  const maxAbs = Math.max(...weights.map(Math.abs));
  return maxAbs / INT4_MAX;
}

export const SCALE = computeScale(WEIGHTS);

function clampLevel(level: number): number {
  return Math.min(INT4_MAX, Math.max(INT4_MIN, level));
}

/** Rounds a weight to its nearest representable 4-bit level. */
export function quantizeLevel(w: number, scale: number = SCALE): number {
  return clampLevel(Math.round(w / scale));
}

/** Reconstructs the weight's value from its quantized level. */
export function dequantize(level: number, scale: number = SCALE): number {
  return level * scale;
}

export function quantizeVector(weights: number[] = WEIGHTS, scale: number = SCALE) {
  return weights.map((w) => {
    const level = quantizeLevel(w, scale);
    const reconstructed = dequantize(level, scale);
    return { original: w, level, reconstructed, error: w - reconstructed };
  });
}

/** Mean squared reconstruction error across the vector. */
export function meanSquaredError(weights: number[] = WEIGHTS, scale: number = SCALE): number {
  const rows = quantizeVector(weights, scale);
  return rows.reduce((sum, r) => sum + r.error ** 2, 0) / rows.length;
}

/** Memory footprint, in bytes, for storing the vector as FP32 (4 bytes/weight, no shared scale needed). */
export function fp32Bytes(n: number): number {
  return n * 4;
}

/** Memory footprint, in bytes, for storing the vector as packed 4-bit levels plus one FP32 scale. */
export function int4Bytes(n: number): number {
  return Math.ceil((n * 4) / 8) + 4;
}

export function compressionRatio(n: number): number {
  return fp32Bytes(n) / int4Bytes(n);
}

/** Unseen checkpoint weight: not one of the original eight. */
export const CHECKPOINT_WEIGHT = 1.1;
export const CHECKPOINT_LEVEL_MIN = -8;
export const CHECKPOINT_LEVEL_MAX = 7;
