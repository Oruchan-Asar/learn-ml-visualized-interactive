import { describe, it, expect } from "vitest";
import {
  happenedBefore,
  isConcurrent,
  eventHappenedBefore,
  eventsAreConcurrent,
  lamportFalselyOrders,
  VECTOR_CLOCKS,
  LAMPORT_TIMESTAMPS,
} from "@/lib/math-core/causality-and-happened-before";

describe("happenedBefore / isConcurrent on raw vector clocks", () => {
  it("[1,0,0] happened-before [2,1,0]", () => {
    expect(happenedBefore([1, 0, 0], [2, 1, 0])).toBe(true);
    expect(isConcurrent([1, 0, 0], [2, 1, 0])).toBe(false);
  });

  it("[3,0,0] and [0,0,1] are concurrent", () => {
    expect(isConcurrent([3, 0, 0], [0, 0, 1])).toBe(true);
    expect(happenedBefore([3, 0, 0], [0, 0, 1])).toBe(false);
    expect(happenedBefore([0, 0, 1], [3, 0, 0])).toBe(false);
  });
});

describe("eventHappenedBefore / eventsAreConcurrent on the fixed trace", () => {
  it("e2 causally precedes e7 (m1 then m2 chain)", () => {
    expect(eventHappenedBefore("e2", "e7")).toBe(true);
  });

  it("e3 and e6 are concurrent", () => {
    expect(eventsAreConcurrent("e3", "e6")).toBe(true);
    expect(eventHappenedBefore("e3", "e6")).toBe(false);
    expect(eventHappenedBefore("e6", "e3")).toBe(false);
  });
});

describe("lamportFalselyOrders", () => {
  it("e3 and e6 are concurrent yet have different Lamport timestamps — the false order", () => {
    expect(LAMPORT_TIMESTAMPS.e3).not.toBe(LAMPORT_TIMESTAMPS.e6);
    expect(lamportFalselyOrders("e3", "e6")).toBe(true);
  });

  it("is false for a genuinely causal pair, even though their Lamport timestamps also differ", () => {
    expect(LAMPORT_TIMESTAMPS.e2).not.toBe(LAMPORT_TIMESTAMPS.e7);
    expect(lamportFalselyOrders("e2", "e7")).toBe(false);
  });

  it("is false for an event compared with itself (equal, not concurrent)", () => {
    expect(lamportFalselyOrders("e5", "e5")).toBe(false);
  });

  it("VECTOR_CLOCKS is re-exported and matches the trace's e1", () => {
    expect(VECTOR_CLOCKS.e1).toEqual([1, 0, 0]);
  });
});
