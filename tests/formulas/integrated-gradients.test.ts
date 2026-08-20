import { describe, it, expect } from "vitest";
import { plainSaliency, integratedGradients, completenessGap, outputDelta, model, BASELINE, INPUT } from "@/lib/math-core/integrated-gradients";

describe("integrated-gradients", () => {
  it("the model is deep in saturation at the input, where plain gradient is nearly zero", () => {
    expect(model(BASELINE)).toBe(0.5);
    expect(model(INPUT)).toBeCloseTo(0.9999546021312976, 12);
    expect(plainSaliency()).toBeCloseTo(0.0002269790386795383, 12);
    expect(plainSaliency()).toBeLessThan(0.001);
  });

  it("the true output change is nearly 0.5, which plain saliency badly underestimates", () => {
    const delta = outputDelta();
    expect(delta).toBeCloseTo(0.4999546021312976, 12);
    expect(plainSaliency()).toBeLessThan(delta / 1000);
  });

  it("integrated gradients with only 1 step reduces to plain saliency's blind spot", () => {
    expect(integratedGradients(1)).toBeCloseTo(0.0004539580773590766, 12);
    expect(completenessGap(1)).toBeGreaterThan(0.49);
  });

  it("more integration steps converge the attribution toward the true output delta", () => {
    expect(integratedGradients(10)).toBeCloseTo(0.3749736845597206, 10);
    expect(integratedGradients(50)).toBeCloseTo(0.47495899050717094, 10);
    expect(integratedGradients(500)).toBeCloseTo(0.49745505457632855, 8);
    expect(completenessGap(10)).toBeGreaterThan(completenessGap(50));
    expect(completenessGap(50)).toBeGreaterThan(completenessGap(500));
  });
});
