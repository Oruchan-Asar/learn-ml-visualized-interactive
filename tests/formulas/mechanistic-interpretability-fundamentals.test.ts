import { describe, it, expect } from "vitest";
import { neuronA, neuronB, output, patchedOutput, EXAMPLES } from "@/lib/math-core/mechanistic-interpretability-fundamentals";

describe("neuronA", () => {
  it("fires only for something large and not metal", () => {
    expect(neuronA({ size: 1, legs: 1, metal: 0 })).toBe(1);
    expect(neuronA({ size: 1, legs: 0, metal: 1 })).toBe(0);
    expect(neuronA({ size: 0, legs: 1, metal: 0 })).toBe(0);
  });
});

describe("neuronB", () => {
  it("fires for anything with legs, regardless of size or material", () => {
    expect(neuronB({ size: 0, legs: 1, metal: 0 })).toBe(2);
    expect(neuronB({ size: 1, legs: 1, metal: 0 })).toBe(2);
    expect(neuronB({ size: 1, legs: 0, metal: 1 })).toBe(0);
  });
});

describe("output", () => {
  it("matches hand-computed scores for all four examples", () => {
    const scores = EXAMPLES.map((ex) => output(ex.features));
    expect(scores).toEqual([-1, 1, 0, -1]);
  });
});

describe("patchedOutput", () => {
  it("patching neuron A from elephant into mouse fully replicates elephant's output", () => {
    const mouse = EXAMPLES[0].features;
    const elephant = EXAMPLES[1].features;
    expect(patchedOutput(mouse, elephant, "A")).toBe(output(elephant));
  });

  it("patching neuron B from elephant into mouse changes nothing, since both already share the same neuron B value", () => {
    const mouse = EXAMPLES[0].features;
    const elephant = EXAMPLES[1].features;
    expect(patchedOutput(mouse, elephant, "B")).toBe(output(mouse));
  });
});
