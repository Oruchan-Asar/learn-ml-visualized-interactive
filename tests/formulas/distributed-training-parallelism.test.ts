import { describe, expect, it } from "vitest";
import {
  TOTAL_PARAMS,
  NUM_GPUS,
  ringAllReduceVolume,
  dataParallelVolume,
  tensorParallelVolume,
  pipelineParallelVolume,
  communicationVolume,
  STRATEGIES,
  CHECKPOINT_GPUS,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/distributed-training-parallelism";

describe("distributed-training-parallelism", () => {
  it("the tiny fixed model has 32 parameters across 2 layers", () => {
    expect(TOTAL_PARAMS).toBe(32);
  });

  it("ring all-reduce moves 2(P-1)/P times the payload", () => {
    expect(ringAllReduceVolume(32, 4)).toBe(48);
    expect(ringAllReduceVolume(100, 1)).toBe(0);
  });

  it("data parallel moves the full gradient through a ring all-reduce", () => {
    expect(dataParallelVolume(NUM_GPUS)).toBe(48);
  });

  it("tensor parallel moves only activations, at every layer boundary, forward and backward", () => {
    expect(tensorParallelVolume(NUM_GPUS)).toBe(24);
  });

  it("pipeline parallel moves the least: point-to-point activations at inter-layer boundaries only", () => {
    expect(pipelineParallelVolume()).toBe(8);
  });

  it("on this tiny model, data > tensor > pipeline in communication volume", () => {
    expect(communicationVolume("data")).toBeGreaterThan(communicationVolume("tensor"));
    expect(communicationVolume("tensor")).toBeGreaterThan(communicationVolume("pipeline"));
  });

  it("lists exactly the three strategies", () => {
    expect(STRATEGIES.map((s) => s.key)).toEqual(["data", "tensor", "pipeline"]);
  });

  it("a larger unseen cluster has an exact, larger data-parallel volume", () => {
    const volume = dataParallelVolume(CHECKPOINT_GPUS);
    expect(volume).toBe(56);
    expect(CHECKPOINT_CANDIDATES).toContain(volume);
  });
});
