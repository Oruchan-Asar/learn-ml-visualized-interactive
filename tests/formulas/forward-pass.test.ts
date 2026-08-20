import { describe, it, expect } from "vitest";
import { LAYER, relu, preActivation, layerOutputs, TARGET_NEURON_INDEX, TARGET_OUTPUT } from "@/lib/math-core/forward-pass";

describe("preActivation, hand-derived at inputs (2,2)", () => {
  it("neuron A (w=(1,-1), b=0): z = 2 - 2 = 0", () => {
    expect(preActivation(LAYER[0], [2, 2])).toBeCloseTo(0, 10);
  });

  it("neuron B (w=(0.5,0.5), b=-1): z = 1 + 1 - 1 = 1", () => {
    expect(preActivation(LAYER[1], [2, 2])).toBeCloseTo(1, 10);
  });

  it("neuron C (w=(-1,2), b=0.5): z = -2 + 4 + 0.5 = 2.5", () => {
    expect(preActivation(LAYER[2], [2, 2])).toBeCloseTo(2.5, 10);
  });
});

describe("layerOutputs applies ReLU to every neuron independently", () => {
  it("at inputs (2,2): [ReLU(0), ReLU(1), ReLU(2.5)] = [0, 1, 2.5]", () => {
    expect(layerOutputs(LAYER, [2, 2], relu)).toEqual([0, 1, 2.5]);
  });

  it("at inputs (-2,-2), all three pre-activations are non-positive: A=0, B=-3, C=-1.5", () => {
    const outputs = layerOutputs(LAYER, [-2, -2], relu);
    expect(preActivation(LAYER[0], [-2, -2])).toBeCloseTo(0, 10);
    expect(preActivation(LAYER[1], [-2, -2])).toBeCloseTo(-3, 10);
    expect(preActivation(LAYER[2], [-2, -2])).toBeCloseTo(-1.5, 10);
    expect(outputs).toEqual([0, 0, 0]);
  });
});

describe("the target neuron B reaches exactly 1 along the whole line x1+x2=4", () => {
  it("at (2,2), (1,3), and (4,0), neuron B's ReLU output is exactly 1", () => {
    for (const [x1, x2] of [[2, 2], [1, 3], [4, 0]] as [number, number][]) {
      const z = preActivation(LAYER[TARGET_NEURON_INDEX], [x1, x2]);
      expect(relu(z)).toBeCloseTo(TARGET_OUTPUT, 10);
    }
  });

  it("at the default start (0,0), neuron B's output is 0, not the target", () => {
    const z = preActivation(LAYER[TARGET_NEURON_INDEX], [0, 0]);
    expect(relu(z)).toBeCloseTo(0, 10);
    expect(relu(z)).not.toBeCloseTo(TARGET_OUTPUT, 1);
  });
});
