/**
 * The roofline model: a kernel's runtime is the max of how long it takes to move its data through HBM
 * and how long it takes to actually compute on it. Which one dominates depends on arithmetic intensity —
 * how many FLOPs get done per byte moved — and that intensity is exactly what changes as a problem grows.
 * Here the toy kernel is a square N x N matmul: it reads/writes O(N^2) bytes but does O(N^3) FLOPs, so
 * larger N pushes it from memory-bound toward compute-bound, with an exact crossover point.
 */

/** Toy HBM bandwidth, in bytes per time unit. */
export const HBM_BANDWIDTH = 3;

/** Toy compute throughput, in FLOPs per time unit. */
export const COMPUTE_RATE = 4;

/** Bytes moved for an N x N matmul: read two N x N operands, write one N x N result, 4 bytes each. */
export function bytesMoved(n: number): number {
  return 3 * n * n * 4;
}

/** FLOPs for an N x N matmul (the standard 2N^3 count). */
export function flopsRequired(n: number): number {
  return 2 * n ** 3;
}

export function transferTime(n: number, bandwidth: number = HBM_BANDWIDTH): number {
  return bytesMoved(n) / bandwidth;
}

export function computeTime(n: number, rate: number = COMPUTE_RATE): number {
  return flopsRequired(n) / rate;
}

/** The kernel's actual runtime: compute and transfer can overlap, so the bottleneck wins. */
export function bottleneckTime(n: number): number {
  return Math.max(transferTime(n), computeTime(n));
}

export type Regime = "memory-bound" | "compute-bound";

export function regime(n: number): Regime {
  return transferTime(n) >= computeTime(n) ? "memory-bound" : "compute-bound";
}

/** Slider range for the Intuition/Play demos. */
export const N_MIN = 1;
export const N_MAX = 16;

/** The exact data size where transfer time equals compute time, for these constants. */
export const CROSSOVER_N = 8;

/** Three unseen data sizes for the checkpoint, spanning both regimes. */
export const CHECKPOINT_CANDIDATES = [3, 6, 10];
