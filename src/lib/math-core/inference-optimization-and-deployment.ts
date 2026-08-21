/**
 * Two independent ways to make a trained model cheaper to run, without changing what it computes:
 * caching already-computed attention keys/values instead of redoing them every step, and storing
 * weights at lower numeric precision instead of full float32.
 */

// --- KV-caching: generating n tokens one at a time, attending back over everything so far ---

/** Without a cache: step k recomputes all k keys/values from scratch. Total work grows quadratically. */
export function workWithoutCache(n: number): number {
  return (n * (n + 1)) / 2;
}

/** With a cache: step k only computes the one new key/value; every earlier one is reused. Total work grows linearly. */
export function workWithCache(n: number): number {
  return n;
}

export function speedupRatio(n: number): number {
  return workWithoutCache(n) / workWithCache(n);
}

// --- Quantization: storing weights at lower precision ---

export const FLOAT32_BITS = 32;
export const INT8_BITS = 8;
export const INT8_MAX = 127;

export const WEIGHTS: number[] = [0.73, -1.42, 2.05, -0.08];

/** Symmetric quantization: scale so the largest-magnitude weight maps to ±127 exactly. */
export function quantizationScale(weights: number[] = WEIGHTS): number {
  return Math.max(...weights.map(Math.abs)) / INT8_MAX;
}

export function quantize(w: number, scale: number): number {
  return Math.round(w / scale);
}

export function dequantize(q: number, scale: number): number {
  return q * scale;
}

export interface QuantizationResult {
  original: number;
  quantized: number;
  reconstructed: number;
  error: number;
}

export function quantizeAll(weights: number[] = WEIGHTS): QuantizationResult[] {
  const scale = quantizationScale(weights);
  return weights.map((w) => {
    const q = quantize(w, scale);
    const reconstructed = dequantize(q, scale);
    return { original: w, quantized: q, reconstructed, error: Math.abs(w - reconstructed) };
  });
}

export const MEMORY_REDUCTION_FACTOR = FLOAT32_BITS / INT8_BITS;
