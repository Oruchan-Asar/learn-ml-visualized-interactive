import { describe, it, expect } from "vitest";
import { residualForwardBackward, residualGradientAtInput } from "@/lib/math-core/resnet-and-residual-connections";
import { gradientAtInput } from "@/lib/math-core/vanishing-gradients";

describe("resnet-and-residual-connections", () => {
  it("the plain network's gradient collapses toward zero as depth grows", () => {
    expect(gradientAtInput(5)).toBeCloseTo(0.000022895657944812534, 15);
    expect(gradientAtInput(10)).toBeCloseTo(2.207937623491196e-9, 18);
    expect(gradientAtInput(20)).toBeCloseTo(2.0591532137304418e-17, 25);
  });

  it("the residual network's gradient stays large at every depth instead of vanishing", () => {
    expect(residualGradientAtInput(5)).toBeCloseTo(32.7225393593485, 8);
    expect(residualGradientAtInput(10)).toBeCloseTo(67.90227340088839, 8);
    expect(residualGradientAtInput(20)).toBeCloseTo(138.26174148396814, 6);
  });

  it("once the block saturates, each additional layer multiplies the gradient by almost exactly 1", () => {
    const result = residualForwardBackward(10);
    // gradients[4..10] are the deep, saturated layers — nearly identical to each other.
    const deepValues = result.gradients.slice(4);
    for (let i = 1; i < deepValues.length; i++) {
      expect(deepValues[i]).toBeCloseTo(deepValues[0], 6);
    }
    // gradients[0] and [1] sit in the shallow, unsaturated regime and differ noticeably more.
    expect(Math.abs(result.gradients[0] - result.gradients[1])).toBeGreaterThan(1);
  });

  it("the residual gradient at depth 10 is vastly larger than the plain network's", () => {
    expect(residualGradientAtInput(10)).toBeGreaterThan(gradientAtInput(10) * 1e9);
  });
});
