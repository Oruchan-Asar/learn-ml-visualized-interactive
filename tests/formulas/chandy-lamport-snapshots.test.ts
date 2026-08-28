import { describe, it, expect } from "vitest";
import {
  NODES,
  ALL_CHANNELS,
  EVENTS,
  INITIAL_BALANCES,
  TOTAL_MONEY,
  MESSAGE_M1,
  runSnapshot,
  snapshotTotal,
  stateOnlyTotal,
  isConsistentSnapshot,
  channelKey,
} from "@/lib/math-core/chandy-lamport-snapshots";

describe("setup", () => {
  it("has 6 directed channels across 3 fully-connected nodes", () => {
    expect(ALL_CHANNELS.length).toBe(6);
  });

  it("TOTAL_MONEY is the sum of the initial balances", () => {
    expect(TOTAL_MONEY).toBe(35);
    expect(NODES.reduce((s, n) => s + INITIAL_BALANCES[n], 0)).toBe(TOTAL_MONEY);
  });
});

describe("running the full snapshot trace", () => {
  const result = runSnapshot(EVENTS);

  it("records every node's balance at the moment it first saw a marker (or initiated)", () => {
    expect(result.recordedStates).toEqual({ N0: 10, N1: 10, N2: 10 });
  });

  it("completes exactly at the last event, once every channel is closed", () => {
    expect(result.completedAtIndex).toBe(14);
  });

  it("records channel N2->N0 as closed holding the in-flight $5 message", () => {
    const c = result.channels.find((c) => c.from === "N2" && c.to === "N0")!;
    expect(c.status).toBe("closed");
    expect(c.messages).toEqual([MESSAGE_M1]);
  });

  it("records every other channel as closed and empty", () => {
    const others = result.channels.filter((c) => !(c.from === "N2" && c.to === "N0"));
    expect(others).toHaveLength(5);
    for (const c of others) {
      expect(c.status).toBe("closed");
      expect(c.messages).toEqual([]);
    }
  });

  it("is a consistent snapshot: state + channel totals reproduce the true starting total", () => {
    expect(snapshotTotal(result)).toBe(35);
    expect(isConsistentSnapshot(result)).toBe(true);
  });

  it("shows the naive (channel-blind) total is wrong — the whole reason channel state matters", () => {
    expect(stateOnlyTotal(result)).toBe(30);
    expect(stateOnlyTotal(result)).not.toBe(TOTAL_MONEY);
  });
});

describe("running a prefix of the trace (mid-snapshot)", () => {
  it("after 5 events, N0 has recorded but N1 and N2 have not yet", () => {
    const result = runSnapshot(EVENTS.slice(0, 5));
    expect(result.recordedStates).toEqual({ N0: 10 });
    expect(result.completedAtIndex).toBeNull();
  });

  it("after 5 events, channel N2->N0 is still open ('recording') and already holds the in-flight $5", () => {
    const result = runSnapshot(EVENTS.slice(0, 5));
    const c = result.channels.find((c) => c.from === "N2" && c.to === "N0")!;
    expect(c.status).toBe("recording");
    expect(c.messages).toEqual([MESSAGE_M1]);
  });

  it("after 5 events, a channel whose receiver hasn't recorded yet is 'not-yet-recording'", () => {
    const result = runSnapshot(EVENTS.slice(0, 5));
    const c = result.channels.find((c) => c.from === "N1" && c.to === "N2")!;
    expect(c.status).toBe("not-yet-recording");
  });

  it("channelKey formats a directed pair consistently", () => {
    expect(channelKey("N0", "N1")).toBe("N0->N1");
  });
});
