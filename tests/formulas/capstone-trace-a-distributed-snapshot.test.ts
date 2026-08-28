import { describe, it, expect } from "vitest";
import {
  NODES,
  ALL_CHANNELS,
  EVENTS,
  INITIAL_BALANCES,
  TOTAL_MONEY,
  MESSAGE_M1,
  MESSAGE_M2,
  runCapstoneSnapshot,
  snapshotTotal,
  stateOnlyTotal,
  isConsistentSnapshot,
} from "@/lib/math-core/capstone-trace-a-distributed-snapshot";

describe("setup", () => {
  it("has a different initial total than the chapter example, all 6 channels present", () => {
    expect(ALL_CHANNELS.length).toBe(6);
    expect(TOTAL_MONEY).toBe(30);
    expect(NODES.reduce((s, n) => s + INITIAL_BALANCES[n], 0)).toBe(TOTAL_MONEY);
  });
});

describe("running the full capstone trace", () => {
  const result = runCapstoneSnapshot(EVENTS);

  it("records each node's balance at the moment it recorded its own state", () => {
    expect(result.recordedStates).toEqual({ N0: 4, N1: 5, N2: 11 });
  });

  it("completes exactly at the last event", () => {
    expect(result.completedAtIndex).toBe(16);
  });

  it("captures both in-flight messages on their respective channels", () => {
    const n2n0 = result.channels.find((c) => c.from === "N2" && c.to === "N0")!;
    const n0n1 = result.channels.find((c) => c.from === "N0" && c.to === "N1")!;
    expect(n2n0.status).toBe("closed");
    expect(n2n0.messages).toEqual([MESSAGE_M1]);
    expect(n0n1.status).toBe("closed");
    expect(n0n1.messages).toEqual([MESSAGE_M2]);
  });

  it("every other channel closes empty", () => {
    const others = result.channels.filter(
      (c) => !(c.from === "N2" && c.to === "N0") && !(c.from === "N0" && c.to === "N1"),
    );
    expect(others).toHaveLength(4);
    for (const c of others) {
      expect(c.status).toBe("closed");
      expect(c.messages).toEqual([]);
    }
  });

  it("is a consistent snapshot with both messages counted", () => {
    expect(snapshotTotal(result)).toBe(30);
    expect(isConsistentSnapshot(result)).toBe(true);
  });

  it("without channel state, the total is short by exactly the two in-flight amounts", () => {
    expect(stateOnlyTotal(result)).toBe(20);
    expect(TOTAL_MONEY - stateOnlyTotal(result)).toBe(MESSAGE_M1.amount + MESSAGE_M2.amount);
  });
});

describe("mid-trace: N1 (the initiator) opens both incoming channels immediately", () => {
  it("right after N1 initiates (event 1), both its incoming channels are already 'recording'", () => {
    const result = runCapstoneSnapshot(EVENTS.slice(0, 2));
    const fromN0 = result.channels.find((c) => c.from === "N0" && c.to === "N1")!;
    const fromN2 = result.channels.find((c) => c.from === "N2" && c.to === "N1")!;
    expect(fromN0.status).toBe("recording");
    expect(fromN2.status).toBe("recording");
  });

  it("by event 8, the $6 has been logged into the still-open N0->N1 channel", () => {
    const result = runCapstoneSnapshot(EVENTS.slice(0, 9));
    const fromN0 = result.channels.find((c) => c.from === "N0" && c.to === "N1")!;
    expect(fromN0.status).toBe("recording");
    expect(fromN0.messages).toEqual([MESSAGE_M2]);
  });
});
