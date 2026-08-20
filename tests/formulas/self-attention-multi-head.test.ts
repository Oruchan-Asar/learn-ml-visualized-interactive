import { describe, expect, it } from "vitest";
import {
  TOKENS,
  FULL_SELF_ATTENTION_MATRIX,
  HEAD_A_MATRIX,
  HEAD_B_MATRIX,
  MOST_DISAGREEING_TOKEN,
  headDisagreement,
} from "@/lib/math-core/self-attention-multi-head";

const THE = TOKENS.findIndex((t) => t.label === "the");
const CAT = TOKENS.findIndex((t) => t.label === "cat");
const SAT = TOKENS.findIndex((t) => t.label === "sat");

describe("plain self-attention: every token queries every token, including itself", () => {
  it("matches Chapter 10's worked example — 'the' attends mostly to itself", () => {
    expect(FULL_SELF_ATTENTION_MATRIX[THE][THE]).toBeCloseTo(0.768, 3);
    expect(FULL_SELF_ATTENTION_MATRIX[THE][CAT]).toBeCloseTo(0.045, 3);
    expect(FULL_SELF_ATTENTION_MATRIX[THE][SAT]).toBeCloseTo(0.187, 3);
  });

  it("'sat' attends exactly uniformly to all three, since it's equidistant from 'the' and 'cat'", () => {
    for (const w of FULL_SELF_ATTENTION_MATRIX[SAT]) expect(w).toBeCloseTo(1 / 3, 10);
  });

  it("every row sums to 1", () => {
    for (const row of FULL_SELF_ATTENTION_MATRIX) {
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });
});

describe("two heads see the same tokens differently", () => {
  it("Head A (x-axis) makes 'cat' query uniformly, since cat's x-coordinate is 0", () => {
    for (const w of HEAD_A_MATRIX[CAT]) expect(w).toBeCloseTo(1 / 3, 10);
  });

  it("Head B (y-axis) makes 'the' query uniformly, since the's y-coordinate is 0", () => {
    for (const w of HEAD_B_MATRIX[THE]) expect(w).toBeCloseTo(1 / 3, 10);
  });

  it("Head A gives 'the' a strong self-preference; Head B gives 'cat' the mirror-image preference", () => {
    expect(HEAD_A_MATRIX[THE][THE]).toBeCloseTo(0.867, 3);
    expect(HEAD_B_MATRIX[CAT][CAT]).toBeCloseTo(0.867, 3);
  });

  it("for 'sat', the two heads point in opposite directions — favoring 'the' vs favoring 'cat'", () => {
    expect(HEAD_A_MATRIX[SAT][THE]).toBeGreaterThan(HEAD_A_MATRIX[SAT][CAT]);
    expect(HEAD_B_MATRIX[SAT][CAT]).toBeGreaterThan(HEAD_B_MATRIX[SAT][THE]);
  });
});

describe("'sat' is where the two heads disagree the most", () => {
  it("'the' and 'cat' have identical, smaller disagreement than 'sat'", () => {
    const dThe = headDisagreement(THE);
    const dCat = headDisagreement(CAT);
    const dSat = headDisagreement(SAT);
    expect(dThe).toBeCloseTo(dCat, 10);
    expect(dSat).toBeGreaterThan(dThe);
  });

  it("matches the named answer", () => {
    const disagreements = TOKENS.map((_, i) => headDisagreement(i));
    const maxIndex = disagreements.indexOf(Math.max(...disagreements));
    expect(TOKENS[maxIndex].label).toBe(MOST_DISAGREEING_TOKEN);
  });
});
