import { describe, it, expect } from "vitest";
import {
  JOINT,
  marginalA,
  marginalB,
  conditionalBGivenA,
  conditionalAGivenB,
  totalMass,
} from "@/lib/math-core/joint-marginal-and-conditional-probability";

describe("totalMass", () => {
  it("the joint table sums to exactly 1", () => {
    expect(totalMass(JOINT)).toBeCloseTo(1, 10);
  });
});

describe("marginalA", () => {
  it("P(a1) = 0.5, P(a2) = 0.5", () => {
    expect(marginalA(JOINT)).toEqual([0.5, 0.5]);
  });
});

describe("marginalB", () => {
  it("P(b1) = 0.3, P(b2) = 0.4, P(b3) = 0.3", () => {
    const [b1, b2, b3] = marginalB(JOINT);
    expect(b1).toBeCloseTo(0.3, 10);
    expect(b2).toBeCloseTo(0.4, 10);
    expect(b3).toBeCloseTo(0.3, 10);
  });

  it("sums to 1", () => {
    const total = marginalB(JOINT).reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe("conditionalBGivenA", () => {
  it("P(B | a1) = [0.4, 0.2, 0.4]", () => {
    const cond = conditionalBGivenA(JOINT, 0);
    expect(cond[0]).toBeCloseTo(0.4, 10);
    expect(cond[1]).toBeCloseTo(0.2, 10);
    expect(cond[2]).toBeCloseTo(0.4, 10);
    expect(cond.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 10);
  });

  it("P(B | a2) = [0.2, 0.6, 0.2]", () => {
    const cond = conditionalBGivenA(JOINT, 1);
    expect(cond[0]).toBeCloseTo(0.2, 10);
    expect(cond[1]).toBeCloseTo(0.6, 10);
    expect(cond[2]).toBeCloseTo(0.2, 10);
    expect(cond.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 10);
  });
});

describe("conditionalAGivenB", () => {
  it("P(a2 | b3) = 1/3", () => {
    const cond = conditionalAGivenB(JOINT, 2);
    expect(cond[1]).toBeCloseTo(1 / 3, 10);
    expect(cond[0]).toBeCloseTo(2 / 3, 10);
  });

  it("every conditionalAGivenB column sums to 1", () => {
    for (let j = 0; j < 3; j++) {
      const total = conditionalAGivenB(JOINT, j).reduce((s, v) => s + v, 0);
      expect(total).toBeCloseTo(1, 10);
    }
  });
});
