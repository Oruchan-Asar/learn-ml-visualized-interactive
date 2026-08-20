import { describe, it, expect } from "vitest";
import { encodeMu, encodeLogVar, sampleReconstructions, klDivergence, reparameterize, decode } from "@/lib/math-core/variational-autoencoders";

describe("variational-autoencoders", () => {
  it("encoding x=2 gives a mean whose decoded reconstruction is exactly the original input", () => {
    const mu = encodeMu(2);
    expect(mu).toBe(1);
    expect(decode(reparameterize(mu, encodeLogVar(2), 0))).toBe(2);
  });

  it("different noise draws from the same input decode to different points scattered around x", () => {
    const samples = sampleReconstructions(2);
    expect(samples.map((s) => s.reconstruction)).toEqual([2, 2.8131393194811984, 1.1868606805188018, 3.6262786389623964]);
    const reconstructions = samples.map((s) => s.reconstruction);
    expect(new Set(reconstructions).size).toBe(reconstructions.length);
  });

  it("KL divergence is the exact closed form, zero only at the standard normal", () => {
    expect(klDivergence(0, 0)).toBe(0);
    expect(klDivergence(1, -1.8)).toBeCloseTo(0.9826494441107932, 12);
    expect(klDivergence(0, -2)).toBeCloseTo(0.5676676416183064, 12);
  });

  it("KL divergence grows as the mean or variance drifts away from the standard normal", () => {
    expect(klDivergence(2, 0)).toBeGreaterThan(klDivergence(1, 0));
    expect(klDivergence(0, 2)).toBeGreaterThan(klDivergence(0, 0));
  });
});
