import { describe, it, expect } from "vitest";
import { backboneFeature, targetPoints, transferTrace, fromScratchTrace, mse, HEAD_TRUE_W } from "@/lib/math-core/capstone-fine-tune-a-pretrained-model";

describe("capstone-fine-tune-a-pretrained-model", () => {
  it("the frozen backbone maps the two new-task inputs to two well-separated features", () => {
    expect(backboneFeature(-1)).toBeCloseTo(-0.8577223804672996, 12);
    expect(backboneFeature(1)).toBeCloseTo(3.8577223804673, 12);
  });

  it("fine-tuning just the head's bias converges in one step at its ideal rate", () => {
    const points = targetPoints();
    const trace = transferTrace(0.5, 1, 0, HEAD_TRUE_W, points);
    expect(trace[1]).toBe(5);
    expect(mse(HEAD_TRUE_W, trace[1], points)).toBe(0);
  });

  it("the same ideal rate explodes when both head parameters are trained jointly from scratch", () => {
    const points = targetPoints();
    const trace = fromScratchTrace(0.5, 3, { w: 0, b: 0 }, points);
    expect(Math.abs(trace[3].w)).toBeGreaterThan(1000);
  });

  it("from-scratch training at a safe rate is still meaningfully off after 10 steps", () => {
    const points = targetPoints();
    const trace = fromScratchTrace(0.05, 10, { w: 0, b: 0 }, points);
    const final = trace[10];
    expect(mse(final.w, final.b, points)).toBeCloseTo(3.328734270672125, 8);
  });

  it("even 50 steps of from-scratch training only approaches, but doesn't match, transfer's exact result", () => {
    const points = targetPoints();
    const trace = fromScratchTrace(0.05, 50, { w: 0, b: 0 }, points);
    const final = trace[50];
    expect(mse(final.w, final.b, points)).toBeCloseTo(0.011479121802728733, 8);
    expect(mse(final.w, final.b, points)).toBeGreaterThan(0);
  });
});
