import { describe, it, expect } from "vitest";
import {
  HISTORY,
  definitelyBefore,
  isValidSequential,
  respectsRealTimeOrder,
  findLinearization,
  isLinearizable,
  findViolatingOp,
  respectsProgramOrder,
  isSequentiallyConsistent,
  CAUSAL_WRITES,
  CAUSAL_VIEW_R1,
  CAUSAL_VIEW_R2,
  CAUSAL_VIEW_BAD,
  respectsCausalOrder,
  LWW_WRITES,
  applyLastWriterWins,
  convergesRegardlessOfOrder,
} from "@/lib/math-core/distributed-consistency-models";

describe("the fixed HISTORY trace", () => {
  it("has 5 ops on one key", () => {
    expect(HISTORY.length).toBe(5);
    expect(new Set(HISTORY.map((o) => o.key))).toEqual(new Set(["x"]));
  });

  it("every operation's interval is disjoint from every other's", () => {
    for (const a of HISTORY) {
      for (const b of HISTORY) {
        if (a.id !== b.id) expect(definitelyBefore(a, b) || definitelyBefore(b, a)).toBe(true);
      }
    }
  });
});

describe("isValidSequential", () => {
  it("accepts a replay where every read matches the most recent write", () => {
    const order = HISTORY.filter((o) => o.id !== "op5"); // op1,op2,op3,op4 — all valid
    expect(isValidSequential(order)).toBe(true);
  });

  it("rejects a read before any write to that key", () => {
    const read = HISTORY.find((o) => o.id === "op2")!;
    expect(isValidSequential([read])).toBe(false);
  });
});

describe("linearizability", () => {
  it("HISTORY is NOT linearizable — op5 reads a stale value", () => {
    expect(isLinearizable(HISTORY)).toBe(false);
    expect(findLinearization(HISTORY)).toBeNull();
  });

  it("removing op5 makes the rest linearizable", () => {
    const without = HISTORY.filter((o) => o.id !== "op5");
    expect(isLinearizable(without)).toBe(true);
    expect(respectsRealTimeOrder(without, without)).toBe(true);
  });

  it("findViolatingOp identifies op5 as the single culprit", () => {
    expect(findViolatingOp(HISTORY)?.id).toBe("op5");
  });

  it("findViolatingOp returns null for an already-linearizable history", () => {
    const without = HISTORY.filter((o) => o.id !== "op5");
    expect(findViolatingOp(without)).toBeNull();
  });
});

describe("sequential consistency — strictly weaker than linearizability", () => {
  it("HISTORY IS sequentially consistent, despite failing linearizability", () => {
    expect(isSequentiallyConsistent(HISTORY)).toBe(true);
  });

  it("respectsProgramOrder rejects a reordering of a single client's own ops", () => {
    const swapped = [...HISTORY];
    [swapped[1], swapped[4]] = [swapped[4], swapped[1]]; // swaps op2 and op5, both client c1 — breaks their relative order
    expect(respectsProgramOrder(swapped, HISTORY)).toBe(false);
  });

  it("respectsProgramOrder accepts the identity ordering", () => {
    expect(respectsProgramOrder(HISTORY, HISTORY)).toBe(true);
  });
});

describe("causal consistency", () => {
  it("both R1 and R2 views are valid, despite disagreeing on w1 vs w3's order", () => {
    expect(respectsCausalOrder(CAUSAL_VIEW_R1, CAUSAL_WRITES)).toBe(true);
    expect(respectsCausalOrder(CAUSAL_VIEW_R2, CAUSAL_WRITES)).toBe(true);
  });

  it("a view applying w2 before its dependency w1 is invalid", () => {
    expect(respectsCausalOrder(CAUSAL_VIEW_BAD, CAUSAL_WRITES)).toBe(false);
  });
});

describe("eventual consistency via last-writer-wins", () => {
  it("applyLastWriterWins picks the highest-timestamp write", () => {
    expect(applyLastWriterWins(LWW_WRITES)).toBe(7); // u3 has ts=3, the max
  });

  it("converges to the same value regardless of delivery order", () => {
    expect(convergesRegardlessOfOrder(LWW_WRITES)).toBe(true);
    expect(applyLastWriterWins([...LWW_WRITES].reverse())).toBe(7);
  });
});
