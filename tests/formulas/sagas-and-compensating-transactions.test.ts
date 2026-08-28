import { describe, it, expect } from "vitest";
import { STEPS, runSaga, compensationCount, compensationOrder } from "@/lib/math-core/sagas-and-compensating-transactions";

describe("the fixed saga", () => {
  it("has exactly 4 steps", () => {
    expect(STEPS.length).toBe(4);
  });
});

describe("a fully successful run", () => {
  it("runs all 4 steps forward with no compensation at all", () => {
    const trace = runSaga(null);
    expect(trace.length).toBe(4);
    expect(trace.every((t) => t.kind === "forward")).toBe(true);
    expect(trace.map((t) => t.action)).toEqual(["Reserve funds", "Book flight", "Book hotel", "Charge card"]);
  });
});

describe("failing on the last step (index 3, charging the card)", () => {
  const trace = runSaga(3);

  it("completes the first 3 steps forward, then fails on the 4th", () => {
    expect(trace.slice(0, 3).every((t) => t.kind === "forward")).toBe(true);
    expect(trace[3]).toEqual({ index: 3, kind: "failed", action: "Charge card" });
  });

  it("compensates exactly the 3 completed steps, in strict reverse order", () => {
    const compensations = trace.filter((t) => t.kind === "compensation");
    expect(compensations.map((t) => t.action)).toEqual(["Cancel hotel", "Cancel flight", "Release funds"]);
  });

  it("has 7 total entries: 3 forward + 1 failed + 3 compensation", () => {
    expect(trace.length).toBe(7);
  });
});

describe("failing immediately (index 0, reserving funds)", () => {
  it("needs no compensation at all — nothing had completed yet", () => {
    const trace = runSaga(0);
    expect(trace).toEqual([{ index: 0, kind: "failed", action: "Reserve funds" }]);
    expect(compensationCount(0)).toBe(0);
  });
});

describe("failing partway (index 2, booking the hotel)", () => {
  it("compensates exactly 2 steps: cancel flight, then release funds", () => {
    const trace = runSaga(2);
    const compensations = trace.filter((t) => t.kind === "compensation").map((t) => t.action);
    expect(compensations).toEqual(["Cancel flight", "Release funds"]);
    expect(compensationCount(2)).toBe(2);
  });
});

describe("compensation order is always the reverse of completion order", () => {
  it("matches compensationOrder for a mid-saga failure", () => {
    expect(compensationOrder(3)).toEqual([2, 1, 0]);
    expect(compensationOrder(2)).toEqual([1, 0]);
    expect(compensationOrder(1)).toEqual([0]);
  });

  it("is empty when nothing completed", () => {
    expect(compensationOrder(0)).toEqual([]);
    expect(compensationOrder(null)).toEqual([]);
  });
});
