import { describe, expect, it } from "vitest";
import {
  HBM_BANDWIDTH,
  COMPUTE_RATE,
  bytesMoved,
  flopsRequired,
  transferTime,
  computeTime,
  bottleneckTime,
  regime,
  CROSSOVER_N,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/gpu-memory-hierarchies-and-profiling";

describe("gpu-memory-hierarchies-and-profiling", () => {
  it("bytes moved and FLOPs required scale as N^2 and N^3", () => {
    expect(bytesMoved(8)).toBe(768);
    expect(flopsRequired(8)).toBe(1024);
  });

  it("at the crossover N, transfer time exactly equals compute time", () => {
    expect(transferTime(CROSSOVER_N)).toBe(256);
    expect(computeTime(CROSSOVER_N)).toBe(256);
    expect(bottleneckTime(CROSSOVER_N)).toBe(256);
  });

  it("small N is memory-bound", () => {
    expect(transferTime(3)).toBeCloseTo(36, 10);
    expect(computeTime(3)).toBeCloseTo(13.5, 10);
    expect(regime(3)).toBe("memory-bound");
  });

  it("large N is compute-bound", () => {
    expect(transferTime(10)).toBe(400);
    expect(computeTime(10)).toBe(500);
    expect(regime(10)).toBe("compute-bound");
  });

  it("the checkpoint candidates span both regimes with one clear compute-bound answer", () => {
    const regimes = CHECKPOINT_CANDIDATES.map((n) => regime(n));
    expect(regimes.filter((r) => r === "compute-bound")).toHaveLength(1);
  });

  it("bandwidth and compute rate constants are the ones the formulas above assume", () => {
    expect(HBM_BANDWIDTH).toBe(3);
    expect(COMPUTE_RATE).toBe(4);
  });
});
