import { describe, it, expect } from "vitest";
import { APPLICANTS, RAW_WEIGHTS, RISK_LABELS, shrinkWeights, logits, classify, accuracyAt } from "@/lib/math-core/capstone-financial-risk-scorer";

describe("raw (unregularized) weights classify every applicant correctly", () => {
  it("gives all 4 applicants their true risk class as the argmax", () => {
    expect(accuracyAt(0)).toBe(4);
  });

  it("Cora (heavy debt, 3 late payments) gets a confident, correct 'high' prediction", () => {
    const cora = APPLICANTS.find((a) => a.name === "Cora")!;
    const result = classify(RAW_WEIGHTS, cora);
    expect(RISK_LABELS[result.predicted]).toBe("high");
    expect(result.probabilities[2]).toBeGreaterThan(0.99);
  });
});

describe("shrinkWeights leaves the bias untouched and shrinks the rest toward zero", () => {
  it("halves the non-bias weights at lambda=1", () => {
    const shrunk = shrinkWeights(RAW_WEIGHTS, 1);
    expect(shrunk[0].bias).toBe(6);
    expect(shrunk[0].debtWeight).toBeCloseTo(-0.5, 10);
    expect(shrunk[2].lateWeight).toBeCloseTo(0.5, 10);
  });
});

describe("over-regularizing silently flips correct predictions to under-estimated risk", () => {
  it("still classifies all 4 correctly at lambda=0.2", () => {
    expect(accuracyAt(0.2)).toBe(4);
  });

  it("drops to only 2 correct at lambda=0.3, as Bao and Deja get relabeled 'low'", () => {
    expect(accuracyAt(0.3)).toBe(2);
    const shrunk = shrinkWeights(RAW_WEIGHTS, 0.3);
    const bao = APPLICANTS.find((a) => a.name === "Bao")!;
    const deja = APPLICANTS.find((a) => a.name === "Deja")!;
    expect(RISK_LABELS[classify(shrunk, bao).predicted]).toBe("low");
    expect(RISK_LABELS[classify(shrunk, deja).predicted]).toBe("low");
  });

  it("at a very large lambda, every applicant collapses to the same 'low' prediction", () => {
    const shrunk = shrinkWeights(RAW_WEIGHTS, 50);
    const predictions = APPLICANTS.map((a) => classify(shrunk, a).predicted);
    expect(new Set(predictions).size).toBe(1);
    expect(RISK_LABELS[predictions[0]]).toBe("low");
  });
});

it("logits() applies bias + debtWeight*debtRatio + lateWeight*latePayments per class", () => {
  const alex = APPLICANTS.find((a) => a.name === "Alex")!;
  expect(logits(RAW_WEIGHTS, alex)).toEqual([4, 2, -2]);
});
