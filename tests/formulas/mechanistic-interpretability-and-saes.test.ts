import { describe, it, expect } from "vitest";
import { mix, unmix, EXAMPLES, CANDIDATES } from "@/lib/math-core/mechanistic-interpretability-and-saes";

describe("mix", () => {
  it("matches the hand-computed tangled activation for every example", () => {
    const [cat0, cat1] = mix(EXAMPLES[0].concepts);
    expect(cat0).toBeCloseTo(3, 10);
    expect(cat1).toBeCloseTo(1, 10);
    const [stock0, stock1] = mix(EXAMPLES[1].concepts);
    expect(stock0).toBeCloseTo(0.5, 10);
    expect(stock1).toBeCloseTo(3, 10);
    const [mixed0, mixed1] = mix(EXAMPLES[2].concepts);
    expect(mixed0).toBeCloseTo(1.5, 10);
    expect(mixed1).toBeCloseTo(2.2, 10);
  });

  it("neither raw dimension is zero for a pure single-concept input — the whole point of superposition", () => {
    const raw = mix(EXAMPLES[0].concepts); // pure "animal"
    expect(raw[0]).not.toBe(0);
    expect(raw[1]).not.toBe(0);
  });
});

describe("unmix", () => {
  it("exactly recovers the original clean concept strengths for every example", () => {
    for (const ex of EXAMPLES) {
      const recovered = unmix(mix(ex.concepts));
      expect(recovered.animal).toBeCloseTo(ex.concepts.animal, 10);
      expect(recovered.finance).toBeCloseTo(ex.concepts.finance, 10);
    }
  });

  it("matches the hand-computed exact recovery for the ambiguous mixed example", () => {
    const recovered = unmix([1.5, 2.2]);
    expect(recovered.animal).toBeCloseTo(0.4, 10);
    expect(recovered.finance).toBeCloseTo(0.6, 10);
  });
});

describe("CANDIDATES", () => {
  it("candidate 1 is the only one whose decoded concepts are animal-dominant", () => {
    const dominant = CANDIDATES.filter((c) => {
      const recovered = unmix(mix(c.concepts));
      return recovered.animal > recovered.finance;
    });
    expect(dominant).toHaveLength(1);
    expect(dominant[0].label).toBe("candidate 1");
  });

  it("candidate 3 decodes to a genuine tie", () => {
    const recovered = unmix(mix(CANDIDATES[2].concepts));
    expect(recovered.animal).toBeCloseTo(recovered.finance, 10);
  });
});
