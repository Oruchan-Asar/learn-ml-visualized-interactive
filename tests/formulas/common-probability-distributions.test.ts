import { describe, it, expect } from "vitest";
import {
  bernoulliPmf,
  poissonPmf,
  gaussianPdf,
  dirichletMean,
  dirichletMode,
} from "@/lib/math-core/common-probability-distributions";

describe("bernoulliPmf", () => {
  it("Bernoulli(p=0.3): P(1) = 0.3, P(0) = 0.7", () => {
    expect(bernoulliPmf(0.3, 1)).toBeCloseTo(0.3, 10);
    expect(bernoulliPmf(0.3, 0)).toBeCloseTo(0.7, 10);
  });
});

describe("poissonPmf", () => {
  it("Poisson(lambda=2): P(0) = e^-2", () => {
    expect(poissonPmf(2, 0)).toBeCloseTo(Math.exp(-2), 10);
    expect(poissonPmf(2, 0)).toBeCloseTo(0.135335, 5);
  });

  it("Poisson(lambda=2): P(1) = P(2) = 2*e^-2 (a known tie for lambda=2)", () => {
    const p1 = poissonPmf(2, 1);
    const p2 = poissonPmf(2, 2);
    expect(p1).toBeCloseTo(2 * Math.exp(-2), 10);
    expect(p2).toBeCloseTo(2 * Math.exp(-2), 10);
    expect(p1).toBeCloseTo(p2, 10);
    expect(p1).toBeCloseTo(0.270671, 5);
  });

  it("Poisson(lambda=2): P(3) = (4/3)*e^-2", () => {
    expect(poissonPmf(2, 3)).toBeCloseTo((4 / 3) * Math.exp(-2), 10);
  });
});

describe("gaussianPdf", () => {
  it("standard normal at z=0 is 1/sqrt(2*pi)", () => {
    expect(gaussianPdf(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 10);
    expect(gaussianPdf(0, 0, 1)).toBeCloseTo(0.398942, 5);
  });

  it("standard normal at z=1", () => {
    expect(gaussianPdf(1, 0, 1)).toBeCloseTo(0.241971, 5);
  });

  it("standard normal at z=2", () => {
    expect(gaussianPdf(2, 0, 1)).toBeCloseTo(0.053991, 5);
  });
});

describe("dirichletMean", () => {
  it("Dirichlet(alpha=[2,3,5]): mean = [0.2, 0.3, 0.5]", () => {
    const m = dirichletMean([2, 3, 5]);
    expect(m[0]).toBeCloseTo(0.2, 10);
    expect(m[1]).toBeCloseTo(0.3, 10);
    expect(m[2]).toBeCloseTo(0.5, 10);
    expect(m.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 10);
  });
});

describe("dirichletMode", () => {
  it("Dirichlet(alpha=[2,3,5]): mode = [1/7, 2/7, 4/7]", () => {
    const mode = dirichletMode([2, 3, 5]);
    expect(mode[0]).toBeCloseTo(1 / 7, 10);
    expect(mode[1]).toBeCloseTo(2 / 7, 10);
    expect(mode[2]).toBeCloseTo(4 / 7, 10);
    expect(mode.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 10);
  });
});
