import { describe, it, expect } from "vitest";
import { entropy } from "@/lib/math-core/entropy";
import {
  P_REFERENCE,
  JOINT,
  klDivergence,
  crossEntropy,
  marginalX,
  marginalY,
  jointEntropy,
  mutualInformation,
} from "@/lib/math-core/kl-divergence-and-mutual-information";

describe("KL divergence", () => {
  it("is exactly 0 when the two distributions are identical", () => {
    expect(klDivergence(P_REFERENCE, P_REFERENCE)).toBeCloseTo(0, 10);
  });

  it("matches a hand-computed value for a specific Q", () => {
    const q = [0.4, 0.4, 0.2];
    expect(klDivergence(P_REFERENCE, q)).toBeCloseTo(0.03645279766002797, 10);
  });

  it("is asymmetric — D_KL(P||Q) != D_KL(Q||P) in general", () => {
    const q = [0.4, 0.4, 0.2];
    const forward = klDivergence(P_REFERENCE, q);
    const backward = klDivergence(q, P_REFERENCE);
    expect(forward).toBeCloseTo(0.03645279766002797, 10);
    expect(backward).toBeCloseTo(0.03724376175659269, 10);
    expect(forward).not.toBeCloseTo(backward, 4);
  });

  it("is always non-negative", () => {
    const q = [0.1, 0.1, 0.8];
    expect(klDivergence(P_REFERENCE, q)).toBeGreaterThan(0);
  });
});

describe("cross-entropy decomposes into entropy plus KL divergence", () => {
  it("H(P, Q) = H(P) + D_KL(P || Q) exactly", () => {
    const q = [0.4, 0.4, 0.2];
    const lhs = crossEntropy(P_REFERENCE, q);
    const rhs = entropy(P_REFERENCE) + klDivergence(P_REFERENCE, q);
    expect(lhs).toBeCloseTo(rhs, 10);
    expect(lhs).toBeCloseTo(1.5219280948873621, 10);
  });

  it("cross-entropy against itself equals plain entropy", () => {
    expect(crossEntropy(P_REFERENCE, P_REFERENCE)).toBeCloseTo(entropy(P_REFERENCE), 10);
  });
});

describe("mutual information from the fixed joint distribution", () => {
  it("both marginals are uniform (0.5, 0.5)", () => {
    expect(marginalX(JOINT)).toEqual([0.5, 0.5]);
    expect(marginalY(JOINT)).toEqual([0.5, 0.5]);
  });

  it("matches the hand-computed value, 0.2781 bits", () => {
    expect(mutualInformation(JOINT)).toBeCloseTo(0.27807190511263774, 10);
  });

  it("equals H(X) + H(Y) - H(X, Y) exactly", () => {
    const hx = entropy(marginalX(JOINT));
    const hy = entropy(marginalY(JOINT));
    const hxy = jointEntropy(JOINT);
    expect(hx).toBeCloseTo(1, 10);
    expect(hy).toBeCloseTo(1, 10);
    expect(hxy).toBeCloseTo(1.721928094887362, 10);
    expect(mutualInformation(JOINT)).toBeCloseTo(hx + hy - hxy, 10);
  });

  it("is exactly 0 for a genuinely independent joint distribution", () => {
    const independent = [
      [0.25, 0.25],
      [0.25, 0.25],
    ];
    expect(mutualInformation(independent)).toBeCloseTo(0, 10);
  });
});
