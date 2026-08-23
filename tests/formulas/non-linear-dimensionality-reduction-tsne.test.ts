import { describe, expect, it } from "vitest";
import {
  HIGH_DIM_POINTS,
  INIT_EMBEDDING,
  computeP,
  computeQ,
  klDivergence,
  train,
  distance,
} from "@/lib/math-core/non-linear-dimensionality-reduction-tsne";

describe("high-dimensional affinities P, hand-computed from two tight pairs far apart", () => {
  const p = computeP(HIGH_DIM_POINTS);

  it("gives each within-pair affinity exactly 0.25 (both pairs are each other's only real neighbor)", () => {
    // sigma=1: w(P2|P1) = exp(-0.5) dominates P1's row (the other two weights are ~exp(-200) and
    // ~exp(-220.5), both negligible), so p_{2|1} ~= 1 and symmetrically p_{1|2} ~= 1.
    // p_12 = (p_{2|1} + p_{1|2}) / (2*4) ~= (1+1)/8 = 0.25.
    expect(p[0][1]).toBeCloseTo(0.25, 6);
    expect(p[2][3]).toBeCloseTo(0.25, 6);
  });

  it("gives cross-pair affinity essentially 0", () => {
    expect(p[0][2]).toBeCloseTo(0, 6);
    expect(p[1][3]).toBeCloseTo(0, 6);
  });

  it("sums to 1 over the whole matrix, as a properly normalized affinity should", () => {
    const total = p.reduce((s, row) => s + row.reduce((rs, v) => rs + v, 0), 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("is symmetric", () => {
    expect(p[0][1]).toBeCloseTo(p[1][0], 10);
    expect(p[1][2]).toBeCloseTo(p[2][1], 10);
  });
});

describe("gradient descent pulls each true pair together without ever seeing the original coordinates", () => {
  const p = computeP(HIGH_DIM_POINTS);
  const trained = train(p, INIT_EMBEDDING, 300);

  it("ends up with P1 much closer to P2 than to P3", () => {
    expect(distance(trained[0], trained[1])).toBeLessThan(distance(trained[0], trained[2]));
  });

  it("ends up with P3 much closer to P4 than to P1", () => {
    expect(distance(trained[2], trained[3])).toBeLessThan(distance(trained[2], trained[0]));
  });

  it("strictly decreases KL divergence from the initial embedding", () => {
    const q0 = computeQ(INIT_EMBEDDING);
    const qFinal = computeQ(trained);
    expect(klDivergence(p, qFinal)).toBeLessThan(klDivergence(p, q0));
  });
});
