import { describe, it, expect } from "vitest";
import {
  EVENTS,
  computeLamportTimestamps,
  computeVectorClocks,
  compareVectorClocks,
  LAMPORT_TIMESTAMPS,
  VECTOR_CLOCKS,
} from "@/lib/math-core/time-clocks-and-ordering";

describe("the fixed 9-event trace", () => {
  it("has 9 events across 3 processes and 3 messages", () => {
    expect(EVENTS.length).toBe(9);
    const messageIds = new Set(EVENTS.map((e) => e.messageId).filter(Boolean));
    expect(messageIds.size).toBe(3);
  });
});

describe("computeLamportTimestamps", () => {
  it("matches the hand-computed timestamps for every event", () => {
    const ts = computeLamportTimestamps(EVENTS);
    expect(ts).toEqual({
      e1: 1,
      e2: 2,
      e3: 3,
      e4: 3,
      e5: 4,
      e6: 1,
      e7: 5,
      e8: 6,
      e9: 7,
    });
  });

  it("a receive jumps to at least the sender's timestamp plus one", () => {
    const ts = computeLamportTimestamps(EVENTS);
    expect(ts.e4).toBeGreaterThan(ts.e2); // e4 receives m1 sent at e2
    expect(ts.e7).toBeGreaterThan(ts.e5); // e7 receives m2 sent at e5
  });

  it("LAMPORT_TIMESTAMPS is precomputed from EVENTS", () => {
    expect(LAMPORT_TIMESTAMPS).toEqual(computeLamportTimestamps(EVENTS));
  });
});

describe("computeVectorClocks", () => {
  it("matches the hand-computed vector clocks for every event", () => {
    const vc = computeVectorClocks(EVENTS);
    expect(vc).toEqual({
      e1: [1, 0, 0],
      e2: [2, 0, 0],
      e3: [3, 0, 0],
      e4: [2, 1, 0],
      e5: [2, 2, 0],
      e6: [0, 0, 1],
      e7: [2, 2, 2],
      e8: [2, 2, 3],
      e9: [4, 2, 3],
    });
  });

  it("VECTOR_CLOCKS is precomputed from EVENTS", () => {
    expect(VECTOR_CLOCKS).toEqual(computeVectorClocks(EVENTS));
  });
});

describe("compareVectorClocks", () => {
  it("e2 happened-before e7 — a real causal chain via m1 then m2", () => {
    expect(compareVectorClocks(VECTOR_CLOCKS.e2, VECTOR_CLOCKS.e7)).toBe("before");
  });

  it("e7 happened-after e2, symmetrically", () => {
    expect(compareVectorClocks(VECTOR_CLOCKS.e7, VECTOR_CLOCKS.e2)).toBe("after");
  });

  it("e3 and e6 are concurrent — no message links P0's third event to P2's first", () => {
    expect(compareVectorClocks(VECTOR_CLOCKS.e3, VECTOR_CLOCKS.e6)).toBe("concurrent");
  });

  it("an event's vector clock equals itself", () => {
    expect(compareVectorClocks(VECTOR_CLOCKS.e5, VECTOR_CLOCKS.e5)).toBe("equal");
  });
});
