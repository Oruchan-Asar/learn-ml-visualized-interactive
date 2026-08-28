import { describe, it, expect } from "vitest";
import {
  INITIAL_STATE,
  DEPOSIT_AMOUNT,
  BUYER,
  SELLER,
  stateHash,
  applyAction,
  runEscrow,
} from "@/lib/math-core/smart-contracts-and-decentralized-applications";

describe("stateHash", () => {
  it("matches hand-worked hashes for each phase", () => {
    expect(stateHash(INITIAL_STATE)).toBe(905);
    expect(stateHash({ ...INITIAL_STATE, phase: "funded", balance: 50 })).toBe(400);
    expect(stateHash({ ...INITIAL_STATE, phase: "released", balance: 50 })).toBe(367);
    expect(stateHash({ ...INITIAL_STATE, phase: "refunded", balance: 50 })).toBe(485);
  });

  it("is deterministic — recomputing from the same state always gives the same hash", () => {
    expect(stateHash(INITIAL_STATE)).toBe(stateHash({ ...INITIAL_STATE }));
  });
});

describe("applyAction", () => {
  it("moves created -> funded on deposit", () => {
    const funded = applyAction(INITIAL_STATE, { type: "deposit", amount: DEPOSIT_AMOUNT });
    expect(funded).toEqual({ phase: "funded", balance: 50, buyer: BUYER, seller: SELLER });
  });

  it("moves funded -> released on release", () => {
    const funded = applyAction(INITIAL_STATE, { type: "deposit", amount: DEPOSIT_AMOUNT });
    expect(applyAction(funded, { type: "release" }).phase).toBe("released");
  });

  it("moves funded -> refunded on refund", () => {
    const funded = applyAction(INITIAL_STATE, { type: "deposit", amount: DEPOSIT_AMOUNT });
    expect(applyAction(funded, { type: "refund" }).phase).toBe("refunded");
  });

  it("ignores an out-of-order action instead of corrupting state (e.g. releasing before funding)", () => {
    expect(applyAction(INITIAL_STATE, { type: "release" })).toEqual(INITIAL_STATE);
  });
});

describe("runEscrow", () => {
  it("stops after funding when outcome is null", () => {
    const trace = runEscrow(null);
    expect(trace).toHaveLength(2);
    expect(trace[1].state.phase).toBe("funded");
  });

  it("produces a 3-step trace ending in released", () => {
    const trace = runEscrow("release");
    expect(trace).toHaveLength(3);
    expect(trace[2].state.phase).toBe("released");
    expect(trace[2].hash).toBe(367);
  });

  it("produces a 3-step trace ending in refunded", () => {
    const trace = runEscrow("refund");
    expect(trace).toHaveLength(3);
    expect(trace[2].state.phase).toBe("refunded");
    expect(trace[2].hash).toBe(485);
  });

  it("two independent runs of the same script converge on identical hashes at every step", () => {
    const runA = runEscrow("release");
    const runB = runEscrow("release");
    expect(runA.map((t) => t.hash)).toEqual(runB.map((t) => t.hash));
  });
});
