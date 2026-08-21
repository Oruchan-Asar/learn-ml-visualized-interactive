import { describe, it, expect } from "vitest";
import { conditionedReverse, finalX0, UNCONDITIONAL_NOISE, CAT_NOISE, DOG_NOISE, SHARED_X_T } from "@/lib/math-core/text-conditioned-diffusion";

describe("text-conditioned-diffusion", () => {
  it("all three reverse processes start from the exact same noisy input", () => {
    expect(conditionedReverse(UNCONDITIONAL_NOISE)[0].value).toBe(SHARED_X_T);
    expect(conditionedReverse(CAT_NOISE)[0].value).toBe(SHARED_X_T);
    expect(conditionedReverse(DOG_NOISE)[0].value).toBe(SHARED_X_T);
  });

  it("the same starting noise reaches three different final values depending on the conditioning", () => {
    expect(finalX0(UNCONDITIONAL_NOISE)).toBeCloseTo(3.6369648372665395, 12);
    expect(finalX0(CAT_NOISE)).toBeCloseTo(4.330072361116913, 12);
    expect(finalX0(DOG_NOISE)).toBeCloseTo(2.789001727285007, 12);
  });

  it("cat- and dog-conditioning steer the result in opposite directions from the unconditional baseline", () => {
    const uncond = finalX0(UNCONDITIONAL_NOISE);
    const cat = finalX0(CAT_NOISE);
    const dog = finalX0(DOG_NOISE);
    expect(cat).toBeGreaterThan(uncond);
    expect(dog).toBeLessThan(uncond);
  });
});
